# SUNBOT QUOTATION DESIGN STANDARD — V1 LOCK

Locked: 2026-09-08

This file records the stable V1 design and document-generation contract for the Sunbot quotation system.

## Baseline
- Design baseline commit before lock: `81a41a288155af1a8dff7ad837f87409438a7acc`
- Production path: `/quotation/v3/`
- Primary design language: teal `#0F766E` + Sunbot orange `#F97316`
- Document types: Quotation, Narrative, Proposal, standalone items/repair estimate.

## Locked principles
1. Teal structures the page; orange is the Sunbot accent.
2. A4 document structure: brand header → document title → recipient → commercial/content body → total/terms → footer.
3. Footer must sit at the bottom of the document page.
4. Print must isolate the A4 print stage and preserve colors as far as browser printing allows.
5. Two commercial flows only: `Triển khai / mở rộng` and `Hạng mục rời / sửa chữa`.
6. Narrative/Proposal are available only for `Triển khai / mở rộng`.
7. Admin may edit document title, reorder lines, mark `Hạng mục khuyến nghị`, and apply authorized commercial discount.
8. Sale requests quotations and follows deals; Admin constructs and issues commercial documents.
9. Backend is the official price source. Historical Level/Legacy/support logic must not reappear in new quotations.
10. Quotation data is stored as snapshot/version data; documents can be regenerated from the snapshot without depending on pre-generated Drive PDFs.

## Canonical human-readable standard
Google Doc: `SUNBOT - CHUẨN THIẾT KẾ & SINH TÀI LIỆU BÁO GIÁ V1`

## Fallback ChatGPT skill
Drive file: `SUNBOT_QUOTATION_V1_SKILL.md`

Any future change to the locked principles above must be documented as V2 or as an explicitly dated patch, not silently folded into V1.
