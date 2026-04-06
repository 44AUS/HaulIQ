from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import UUID
from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.database import get_db
from app.models.booking import Booking, BookingStatus
from app.models.load import Load
from app.models.user import User
from app.models.broker import Broker
from app.middleware.auth import get_current_user

router = APIRouter()

# ── Colours ────────────────────────────────────────────────────────────────────
NAVY   = colors.HexColor("#0D2137")
BLUE   = colors.HexColor("#1976D2")
LIGHT  = colors.HexColor("#F0F4F8")
GREY   = colors.HexColor("#64748B")
BLACK  = colors.black
WHITE  = colors.white


def _build_pdf(booking: Booking, load: Load, carrier: User, broker_profile: Broker | None) -> BytesIO:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    normal = styles["Normal"]

    def style(name, **kwargs):
        return ParagraphStyle(name, parent=normal, **kwargs)

    title_style    = style("title",    fontSize=22, textColor=NAVY,  fontName="Helvetica-Bold", spaceAfter=2)
    sub_style      = style("sub",      fontSize=9,  textColor=GREY,  fontName="Helvetica")
    label_style    = style("label",    fontSize=8,  textColor=GREY,  fontName="Helvetica-Bold", spaceBefore=4)
    value_style    = style("value",    fontSize=10, textColor=BLACK, fontName="Helvetica")
    section_style  = style("section",  fontSize=10, textColor=WHITE, fontName="Helvetica-Bold")
    sig_label      = style("sig",      fontSize=8,  textColor=GREY,  fontName="Helvetica")

    def section_header(text):
        tbl = Table([[Paragraph(text, section_style)]], colWidths=[7 * inch])
        tbl.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), NAVY),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ]))
        return tbl

    def info_row(label, value):
        return [Paragraph(label, label_style), Paragraph(str(value) if value else "—", value_style)]

    story = []

    # ── Header ─────────────────────────────────────────────────────────────────
    header_tbl = Table([
        [
            Paragraph("HaulIQ", style("logo", fontSize=20, textColor=NAVY, fontName="Helvetica-Bold")),
            Paragraph("RATE CONFIRMATION", style("rc", fontSize=16, textColor=BLUE, fontName="Helvetica-Bold", alignment=TA_RIGHT)),
        ]
    ], colWidths=[3.5 * inch, 3.5 * inch])
    header_tbl.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
    story.append(header_tbl)
    story.append(HRFlowable(width="100%", thickness=2, color=NAVY, spaceAfter=6))

    # Reference line
    ref_text = (
        f"<font color='#64748B'>Load Ref:</font> <b>{str(load.id)[:8].upper()}</b>"
        f"&nbsp;&nbsp;&nbsp;"
        f"<font color='#64748B'>Booking ID:</font> <b>{str(booking.id)[:8].upper()}</b>"
        f"&nbsp;&nbsp;&nbsp;"
        f"<font color='#64748B'>Generated:</font> <b>{datetime.utcnow().strftime('%B %d, %Y')}</b>"
    )
    story.append(Paragraph(ref_text, style("ref", fontSize=9, fontName="Helvetica")))
    story.append(Spacer(1, 12))

    # ── Broker & Carrier side by side ──────────────────────────────────────────
    broker_user  = load.broker_user
    broker_name  = broker_profile.name if broker_profile else ((broker_user.company or broker_user.name) if broker_user else "—")
    broker_mc    = broker_profile.mc_number if broker_profile else "—"
    broker_pay   = broker_profile.pay_speed.value if broker_profile and broker_profile.pay_speed else "Net-30"
    broker_email = broker_user.email if broker_user else "—"
    broker_phone = (broker_user.phone or "—") if broker_user else "—"

    carrier_name  = carrier.company or carrier.name
    carrier_mc    = carrier.mc_number or "—"
    carrier_email = carrier.email
    carrier_phone = carrier.phone or "—"
    driver_name   = booking.driver_name or "—"
    driver_phone  = booking.driver_phone or "—"

    def party_block(title, name, mc, email, phone, extra_label=None, extra_val=None):
        rows = [
            [Paragraph(title, section_style)],
            [Paragraph("Company", label_style), Paragraph(name, value_style)],
            [Paragraph("MC #",    label_style), Paragraph(mc,   value_style)],
            [Paragraph("Email",   label_style), Paragraph(email, value_style)],
            [Paragraph("Phone",   label_style), Paragraph(phone, value_style)],
        ]
        if extra_label:
            rows.append([Paragraph(extra_label, label_style), Paragraph(extra_val or "—", value_style)])
        t = Table(rows, colWidths=[1.0 * inch, 2.3 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY),
            ("SPAN",       (0, 0), (1, 0)),
            ("TOPPADDING",    (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING",   (0, 0), (-1, -1), 6),
            ("GRID", (0, 1), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
        ]))
        return t

    parties = Table(
        [[
            party_block("BROKER", broker_name, broker_mc, broker_email, broker_phone, "Payment Terms", broker_pay),
            Spacer(0.2 * inch, 1),
            party_block("CARRIER", carrier_name, carrier_mc, carrier_email, carrier_phone, "Driver", f"{driver_name}  {driver_phone}"),
        ]],
        colWidths=[3.4 * inch, 0.2 * inch, 3.4 * inch],
    )
    story.append(parties)
    story.append(Spacer(1, 14))

    # ── Shipment Details ───────────────────────────────────────────────────────
    story.append(section_header("SHIPMENT DETAILS"))
    story.append(Spacer(1, 4))

    pickup_addr   = load.pickup_address   or load.origin      or "—"
    delivery_addr = load.delivery_address or load.destination or "—"
    pickup_date   = load.pickup_date.strftime("%B %d, %Y")   if load.pickup_date   else "—"
    delivery_date = load.delivery_date.strftime("%B %d, %Y") if load.delivery_date else "—"
    equip         = f"{load.load_type or '—'}  {load.trailer_length_ft or ''}ft".strip()
    weight        = f"{load.weight_lbs:,} lbs" if load.weight_lbs else "—"
    miles_str     = f"{load.miles:,}" if load.miles else "—"
    commodity     = load.commodity or "—"

    detail_data = [
        ["Pickup Address",   pickup_addr,    "Delivery Address",  delivery_addr],
        ["Pickup Date",      pickup_date,    "Delivery Date",     delivery_date],
        ["Equipment",        equip,          "Weight",            weight],
        ["Miles",            miles_str,      "Commodity",         commodity],
    ]
    detail_rows = []
    for r in detail_data:
        detail_rows.append([
            Paragraph(r[0], label_style), Paragraph(r[1], value_style),
            Paragraph(r[2], label_style), Paragraph(r[3], value_style),
        ])

    detail_tbl = Table(detail_rows, colWidths=[1.3 * inch, 2.2 * inch, 1.3 * inch, 2.2 * inch])
    detail_tbl.setStyle(TableStyle([
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [WHITE, LIGHT]),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
    ]))
    story.append(detail_tbl)
    story.append(Spacer(1, 14))

    # ── Financials ─────────────────────────────────────────────────────────────
    story.append(section_header("RATE & PAYMENT"))
    story.append(Spacer(1, 4))

    rate_per_mile = round(load.rate / load.miles, 2) if load.miles and load.rate else None
    rpm_str = f"${rate_per_mile:.2f}/mi" if rate_per_mile else "—"

    fin_data = Table([
        [
            Paragraph("All-In Rate", label_style),
            Paragraph(f"<b><font size=14>${(load.rate or 0):,.2f}</font></b>", style("rate_val", fontName="Helvetica-Bold", textColor=NAVY)),
            Paragraph("Rate Per Mile", label_style),
            Paragraph(rpm_str, value_style),
            Paragraph("Payment Terms", label_style),
            Paragraph(broker_pay, value_style),
        ]
    ], colWidths=[1.1 * inch, 1.5 * inch, 1.1 * inch, 1.1 * inch, 1.1 * inch, 1.1 * inch])
    fin_data.setStyle(TableStyle([
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#E2E8F0")),
    ]))
    story.append(fin_data)
    story.append(Spacer(1, 14))

    # ── Notes ──────────────────────────────────────────────────────────────────
    load_notes    = load.notes or ""
    carrier_notes = booking.carrier_visible_notes or ""
    combined_notes = "\n".join(filter(None, [load_notes, carrier_notes]))
    if combined_notes:
        story.append(section_header("SPECIAL INSTRUCTIONS"))
        story.append(Spacer(1, 4))
        story.append(Paragraph(combined_notes.replace("\n", "<br/>"), style("notes_val", fontSize=9, leftIndent=6)))
        story.append(Spacer(1, 14))

    # ── Signatures ─────────────────────────────────────────────────────────────
    story.append(section_header("SIGNATURES"))
    story.append(Spacer(1, 8))

    sig_line = "_" * 45
    sig_tbl = Table([
        [Paragraph("Broker Signature", sig_label), Paragraph("Carrier Signature", sig_label)],
        [Paragraph(sig_line, value_style),         Paragraph(sig_line, value_style)],
        [Paragraph(broker_name, sig_label),         Paragraph(carrier_name, sig_label)],
        [Paragraph("Date: ___________________", sig_label), Paragraph("Date: ___________________", sig_label)],
    ], colWidths=[3.5 * inch, 3.5 * inch])
    sig_tbl.setStyle(TableStyle([
        ("TOPPADDING",    (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
    ]))
    story.append(sig_tbl)

    # ── Footer ─────────────────────────────────────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(HRFlowable(width="100%", thickness=0.5, color=GREY))
    story.append(Paragraph(
        "This Rate Confirmation is a binding agreement between the above-named Broker and Carrier. "
        "Generated by HaulIQ · hauliq.com",
        style("footer", fontSize=7, textColor=GREY, alignment=TA_CENTER),
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer


@router.get("/{booking_id}", summary="Download rate confirmation PDF")
def get_rate_confirmation(
    booking_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    load = db.query(Load).filter(Load.id == booking.load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    # Only the assigned carrier or the broker who owns the load may download
    is_carrier = str(booking.carrier_id) == str(current_user.id)
    is_broker  = load.broker_user_id and str(load.broker_user_id) == str(current_user.id)
    if not (is_carrier or is_broker):
        raise HTTPException(status_code=403, detail="Not authorized")

    if booking.status not in (BookingStatus.approved, BookingStatus.in_transit, BookingStatus.completed):
        raise HTTPException(status_code=400, detail="Rate confirmation only available for approved bookings")

    carrier       = db.query(User).filter(User.id == booking.carrier_id).first()
    broker_profile = db.query(Broker).filter(Broker.user_id == load.broker_user_id).first()

    # Eager-load broker_user onto load so _build_pdf can access it
    if not load.broker_user:
        load.broker_user = db.query(User).filter(User.id == load.broker_user_id).first()

    pdf_buffer = _build_pdf(booking, load, carrier, broker_profile)

    filename = f"rate_confirmation_{str(booking_id)[:8].upper()}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
