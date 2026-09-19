# Atomic Register Experiment — Frozen

**Status:** FROZEN BY A0 during Factory v2.0 reorientation  
**Local source:** `edge-functions/migrations/20260916_atomic_authority_set_register.sql`  
**Synthetic state:** table/function present; seven empty test cases; zero authority records and zero register sets  
**Production state:** not deployed

This experiment predates the approved model:

`CASE AUTHORITY → CASE CORE → EDITION PROFILE → SKU RELEASE`

It is excluded from the Phase 0/1 migration chain and must not be deployed, extended, or used to register DC-001/DC-002 authority. A later tranche requires a fresh A0/S0 technical decision and a redesign against the v2.0 state model.

