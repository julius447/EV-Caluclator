<?php
/**
 * Ampy — EV Charging Savings Calculator — Backend
 * Fluent Snippets: set Run Location → Frontend & Backend
 *
 * Prefix:         ampy_ev_calc_
 * REST namespace: ampy-ev-calc/v1
 * Post meta:      _ampy_ev_calc_*
 * Data window:    window.AmpyEvCalcData
 * JS global:      AmpyEvCalculator
 * DOM root:       ampyEvCalc
 *
 * EMBED IN BRICKS CODE ELEMENT (PHP/HTML tab):
 *   By slug:   <?php echo ampy_render_ev_lead_magnet('laddboxkalkylator'); ?>
 *   By ID:     <?php echo ampy_render_ev_lead_magnet(56467); ?>
 *   Auto:      <?php echo ampy_render_ev_lead_magnet(get_the_ID()); ?>
 */
defined( 'ABSPATH' ) || exit;

/** Set to a specific lead-magnet post ID to lock this metabox to one post. 0 = all. */
define( 'AMPY_EV_CALC_POST_ID', 0 );


/* ── Chevron SVG (shared between the two selectors) ─────────────────────── */
function ampy_ev_chevron(): string {
    return '<svg class="ampy-calc__selector-chevron" width="20" height="20" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
}

function ampy_ev_car_icon(): string {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 17H3a2 2 0 0 1-2-2v-4l3.3-5.5A2 2 0 0 1 6.1 4h11.8a2 2 0 0 1 1.7.9L23 10v5a2 2 0 0 1-2 2h-2"/>
      <circle cx="8.5" cy="17" r="2.5"/><circle cx="15.5" cy="17" r="2.5"/>
    </svg>';
}

function ampy_ev_charger_icon(): string {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <rect x="6" y="2" width="12" height="20" rx="2"/>
      <path d="M10 8h4M12 5v6M9 20h6"/>
    </svg>';
}

function ampy_ev_arrow_icon(): string {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 5l7 7-7 7"/>
    </svg>';
}


/* ==========================================================================
   1. REST API
   ========================================================================== */

add_action( 'rest_api_init', function () {

    register_rest_route( 'ampy-ev-calc/v1', '/data/(?P<post_id>\d+)', [
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'ampy_ev_calc_api_get_data',
        'permission_callback' => '__return_true',
        'args'                => [ 'post_id' => [ 'sanitize_callback' => 'absint' ] ],
    ] );

    register_rest_route( 'ampy-ev-calc/v1', '/lead/(?P<post_id>\d+)', [
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'ampy_ev_calc_api_submit_lead',
        // Route stays PUBLIC (no auth) — anti-spam/abuse is enforced inside the
        // callback (honeypot, form-open delta, per-IP rate limit, nonce-when-present,
        // payload cap, type allow-list, GDPR consent). See ampy_ev_calc_api_submit_lead.
        'permission_callback' => '__return_true',
        'args'                => [ 'post_id' => [ 'sanitize_callback' => 'absint' ] ],
    ] );

} );

/** Allowed lead 'type' values. Anything else is rejected (400). */
function ampy_ev_calc_allowed_types(): array {
    return [ 'quote_request', 'email_calculation' ];
}

/** Current consent text/version shown to the user — persisted with each lead. */
function ampy_ev_calc_consent_version(): string { return '2026-06-v1'; }
function ampy_ev_calc_consent_text(): string {
    return 'Jag godkänner att Ampy lagrar mina uppgifter för att kontakta mig om en offert.';
}

/**
 * Best-effort client IP, proxy-aware but spoof-conscious. Used only for
 * coarse rate-limiting (a forged header just rate-limits a different bucket).
 */
function ampy_ev_calc_client_ip(): string {
    $candidates = [ 'HTTP_CF_CONNECTING_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR' ];
    foreach ( $candidates as $key ) {
        if ( empty( $_SERVER[ $key ] ) ) continue;
        $raw = (string) $_SERVER[ $key ];
        $first = trim( explode( ',', $raw )[0] );
        $ip = filter_var( $first, FILTER_VALIDATE_IP );
        if ( $ip ) return $ip;
    }
    return '0.0.0.0';
}

function ampy_ev_calc_api_get_data( WP_REST_Request $req ): WP_REST_Response|WP_Error {
    $post_id = (int) $req['post_id'];
    if ( get_post_type( $post_id ) !== 'lead-magnet' ) {
        return new WP_Error( 'invalid_post', 'Post not found.', [ 'status' => 404 ] );
    }
    $json = get_post_meta( $post_id, '_ampy_ev_calc_data', true );
    if ( empty( $json ) ) {
        return new WP_Error( 'no_data', 'Upload an Excel file in the post settings.', [ 'status' => 404 ] );
    }
    $data = json_decode( $json, true );
    if ( ! $data ) {
        return new WP_Error( 'bad_data', 'Stored data is malformed. Re-import the Excel file.', [ 'status' => 500 ] );
    }
    return rest_ensure_response( $data );
}

function ampy_ev_calc_api_submit_lead( WP_REST_Request $req ): WP_REST_Response|WP_Error {
    $post_id = (int) $req['post_id'];

    // Only accept leads for a real lead-magnet post (don't write meta elsewhere).
    if ( get_post_type( $post_id ) !== 'lead-magnet' ) {
        return new WP_Error( 'invalid_post', 'Post not found.', [ 'status' => 404 ] );
    }

    /* ── PART 3: payload size cap (reject oversized bodies before JSON decode) ── */
    $raw_body = $req->get_body();
    if ( strlen( (string) $raw_body ) > 16384 ) { // 16 KB is ample for this form
        return new WP_Error( 'payload_too_large', 'Payload too large.', [ 'status' => 413 ] );
    }

    $payload = $req->get_json_params();
    if ( empty( $payload ) || ! is_array( $payload ) ) {
        return new WP_Error( 'empty_payload', 'No JSON body received.', [ 'status' => 400 ] );
    }

    /* ── PART 3: type allow-list (reject unknown 'type') ───────────────────── */
    $type = sanitize_text_field( $payload['type'] ?? '' );
    if ( ! in_array( $type, ampy_ev_calc_allowed_types(), true ) ) {
        return new WP_Error( 'bad_type', 'Unknown submission type.', [ 'status' => 400 ] );
    }

    /* ── PART 3: honeypot — a bot fills the hidden field; humans leave it blank ─ */
    $honeypot = $payload['hp'] ?? $payload['website'] ?? $payload['honeypot'] ?? '';
    if ( is_string( $honeypot ) && trim( $honeypot ) !== '' ) {
        // Pretend success so bots don't learn they were caught; store nothing.
        return rest_ensure_response( [ 'success' => true ] );
    }

    /* ── PART 3: form-open delta — reject near-instant (bot) submissions ──────
       The client should send `formElapsedMs` (ms since the form was rendered)
       and/or `formOpenedAt` (epoch ms). When that signal is present and < 2s,
       reject. Absent signal cannot be measured, so it passes (the current
       frontend does not yet send it — see TODO for frontend adoption). */
    $elapsed_ms = null;
    if ( isset( $payload['formElapsedMs'] ) && is_numeric( $payload['formElapsedMs'] ) ) {
        $elapsed_ms = (float) $payload['formElapsedMs'];
    } elseif ( isset( $payload['formOpenedAt'] ) && is_numeric( $payload['formOpenedAt'] ) ) {
        $elapsed_ms = ( microtime( true ) * 1000 ) - (float) $payload['formOpenedAt'];
    }
    if ( $elapsed_ms !== null && $elapsed_ms < 2000 ) {
        return new WP_Error( 'too_fast', 'Form submitted too quickly.', [ 'status' => 400 ] );
    }

    /* ── PART 3: verify X-WP-Nonce WHEN PRESENT (route stays public) ──────────
       The current frontend always sends it (action 'wp_rest'); a logged-out
       visitor with an invalid/expired nonce is rejected, but a missing nonce
       does not auto-reject (route is public by design). */
    $nonce = $req->get_header( 'x_wp_nonce' );
    if ( $nonce !== null && $nonce !== '' && ! wp_verify_nonce( $nonce, 'wp_rest' ) ) {
        return new WP_Error( 'bad_nonce', 'Invalid or expired session token.', [ 'status' => 403 ] );
    }

    /* ── PART 3: per-IP transient rate limit — 5 submissions / 10 minutes ─────
       Check the cap early; increment only once the request is well-formed and
       consented (below) so malformed/consent-less probes don't burn a real
       user's quota, while genuine accepted attempts are still throttled. */
    $ip_key = 'ampy_ev_lead_rl_' . md5( ampy_ev_calc_client_ip() . '|' . $post_id );
    $hits   = (int) get_transient( $ip_key );
    if ( $hits >= 5 ) {
        return new WP_Error( 'rate_limited', 'Too many requests. Please try again later.', [ 'status' => 429 ] );
    }

    /* ── PART 4: GDPR — a consent flag is REQUIRED; reject (400) without it ───
       Accepts top-level `consent`/`gdprConsent` or nested `contact.consent`.
       NOTE FOR FRONTEND: the current JS engine does NOT yet send a consent
       flag — a consent checkbox + `consent: true` in the payload must be added
       to 00_js-engine.js / the lead form before go-live, or every submission
       will 400 here. This is intentional: no consent => no PII stored. */
    $contact_in  = is_array( $payload['contact'] ?? null ) ? $payload['contact'] : [];
    $consent_raw = $payload['consent'] ?? $payload['gdprConsent'] ?? ( $contact_in['consent'] ?? null );
    $has_consent = ( $consent_raw === true || $consent_raw === 1 || $consent_raw === '1'
                     || ( is_string( $consent_raw ) && strtolower( $consent_raw ) === 'true' ) );
    if ( ! $has_consent ) {
        return new WP_Error( 'consent_required',
            'Consent is required to submit this form.', [ 'status' => 400 ] );
    }

    // Well-formed + consented: now consume one rate-limit slot.
    set_transient( $ip_key, $hits + 1, 10 * MINUTE_IN_SECONDS );

    $ts      = sanitize_text_field( $payload['timestamp'] ?? '' );
    $contact = $contact_in;
    $inputs  = is_array( $payload['inputs'] ?? null ) ? $payload['inputs'] : [];
    // `results.ev` is read tolerantly: every field below is `?? default`, so the
    // endpoint NEVER keys on any single property. In particular the R3 prototype
    // dropped `includeInvestment` from this object — its absence is a no-op here
    // (do not reintroduce a hard dependency on it or any other optional field).
    $res     = is_array( $payload['results']['ev'] ?? null ) ? $payload['results']['ev'] : [];

    $webhook_url  = get_post_meta( $post_id, '_ampy_ev_calc_webhook_url',   true );
    $notify_email = get_post_meta( $post_id, '_ampy_ev_calc_notify_email',  true );

    /* Build the notification email body once (used by webhook fallback below). */
    $email_subject = $type === 'quote_request'
        ? 'New quote request — Ampy EV Charger Calculator'
        : 'Calculation emailed — Ampy EV Charger Calculator';
    $lines = [ "Type: {$type}", "Time: {$ts}", '' ];
    if ( $contact ) {
        $lines[] = '--- CONTACT ---';
        foreach ( [ 'name' => 'Name', 'email' => 'Email', 'phone' => 'Phone', 'zip' => 'Postcode' ] as $k => $l ) {
            if ( ! empty( $contact[$k] ) ) $lines[] = "{$l}: " . sanitize_text_field( $contact[$k] );
        }
        $lines[] = '';
    }
    if ( $res ) {
        $lines[] = '--- RESULT ---';
        $lines[] = 'Car:            ' . sanitize_text_field( $res['evModelName'] ?? '' );
        $lines[] = 'Charger:        ' . sanitize_text_field( $res['chargerName'] ?? '' );
        $lines[] = 'Charger price:  ' . ampy_ev_fmt_kr( $res['grossPrice']    ?? 0 );
        $lines[] = 'Green Tech:     ' . ampy_ev_fmt_kr( $res['gronTeknik']    ?? 0 );
        $lines[] = 'Net to pay:     ' . ampy_ev_fmt_kr( $res['netCost']       ?? 0 );
        $lines[] = 'Annual saving:  ' . ampy_ev_fmt_kr( $res['annualSaving']  ?? 0 );
        $lines[] = 'Payback:        ' . number_format( (float)( $res['paybackYears'] ?? 0 ), 1, '.', '' ) . ' years';
        $lines[] = '10-yr profit:   ' . ampy_ev_fmt_kr( $res['cumulative10']  ?? 0 );
    }
    if ( $inputs ) {
        $lines[] = '';
        $lines[] = '--- INPUTS ---';
        $lines[] = 'Region:         ' . sanitize_text_field( $inputs['region']         ?? '' );
        $lines[] = 'Annual km:      ' . (int)( $inputs['annualKm']         ?? 0 );
        $lines[] = 'Public charge:  ' . (int)( $inputs['publicChargingPct'] ?? 0 ) . '%';
        $lines[] = 'Public type:    ' . sanitize_text_field( $inputs['publicChargingType'] ?? '' );
        $lines[] = 'Applicants:     ' . (int)( $inputs['numTaxApplicants'] ?? 1 );
    }
    $email_body = implode( "\n", $lines );

    /* ── PART 5: DURABLE DELIVERY ─────────────────────────────────────────────
       n8n is the primary processor. Send BLOCKING with a short timeout so we
       actually know the outcome. On any non-2xx OR WP_Error, fall through to the
       notification email. The browser is told success ONLY if a durable path
       (webhook 2xx, or fallback email accepted) succeeded. */
    $delivered      = false;
    $delivery_via   = 'none';
    $delivery_note  = '';

    if ( $webhook_url ) {
        $resp = wp_remote_post( $webhook_url, [
            'headers'     => [ 'Content-Type' => 'application/json' ],
            'body'        => wp_json_encode( $payload ),
            'timeout'     => 8,        // short, but blocking so we learn the result
            'blocking'    => true,     // PART 5: must be blocking to detect failure
            'data_format' => 'body',
        ] );
        if ( is_wp_error( $resp ) ) {
            $delivery_note = 'webhook WP_Error: ' . $resp->get_error_message();
        } else {
            $code = (int) wp_remote_retrieve_response_code( $resp );
            if ( $code >= 200 && $code < 300 ) {
                $delivered    = true;
                $delivery_via = 'webhook';
            } else {
                $delivery_note = 'webhook HTTP ' . $code;
            }
        }
    }

    // Fall through to email if the webhook did not durably deliver (or none set).
    if ( ! $delivered && $notify_email ) {
        $mailed = wp_mail( $notify_email, $email_subject, $email_body );
        if ( $mailed ) {
            $delivered    = true;
            $delivery_via = ( $delivery_via === 'webhook' || $delivery_note ) ? 'email_fallback' : 'email';
        } else {
            $delivery_note = trim( $delivery_note . ' | wp_mail failed' );
        }
    }

    /* ── PART 5: record delivery-failure flag/count (surfaced in metabox) ───── */
    if ( ! $delivered ) {
        $fail_count = (int) get_post_meta( $post_id, '_ampy_ev_calc_delivery_failures', true );
        update_post_meta( $post_id, '_ampy_ev_calc_delivery_failures', $fail_count + 1 );
        update_post_meta( $post_id, '_ampy_ev_calc_last_delivery_error',
            current_time( 'mysql' ) . ' — ' . ( $delivery_note ?: 'no delivery channel configured' ) );
    }

    /* ── PART 4: persist consent metadata + lead log ──────────────────────────
       n8n is a downstream PROCESSOR of this PII (DPA required). Raw PII is kept
       in post meta (capped at 100) only as an operational backstop.
       TODO (retention): post-meta PII should follow a retention policy — e.g.
       purge contact details after N days once a lead is exported to the CRM.
       The AMPY_EV_CALC_STORE_RAW_PII switch below lets ops disable raw-PII
       retention entirely (log the lead without name/email/phone/zip). */
    if ( ! defined( 'AMPY_EV_CALC_STORE_RAW_PII' ) ) {
        define( 'AMPY_EV_CALC_STORE_RAW_PII', true );
    }
    $store_pii = (bool) AMPY_EV_CALC_STORE_RAW_PII;

    $log_json = get_post_meta( $post_id, '_ampy_ev_calc_leads', true );
    $log      = $log_json ? (array) json_decode( $log_json, true ) : [];
    array_unshift( $log, [
        'time'    => current_time( 'mysql' ),
        'type'    => $type,
        'contact' => $store_pii ? [
            'name'  => sanitize_text_field( $contact['name']  ?? '' ),
            'email' => sanitize_email(      $contact['email'] ?? '' ),
            'phone' => sanitize_text_field( $contact['phone'] ?? '' ),
            'zip'   => sanitize_text_field( $contact['zip']   ?? '' ),
        ] : [ 'redacted' => true ],
        'car'       => sanitize_text_field( $res['evModelName'] ?? '' ),
        'charger'   => sanitize_text_field( $res['chargerName'] ?? '' ),
        'net'       => (int)( $res['netCost'] ?? 0 ),
        'consent'   => [
            'given'     => true,
            'version'   => ampy_ev_calc_consent_version(),
            'text'      => ampy_ev_calc_consent_text(),
            'timestamp' => current_time( 'mysql' ),
            'ip'        => ampy_ev_calc_client_ip(),
        ],
        'delivery'  => [ 'ok' => $delivered, 'via' => $delivery_via ],
    ] );
    update_post_meta( $post_id, '_ampy_ev_calc_leads',
        wp_json_encode( array_slice( $log, 0, 100 ) ) );

    /* ── PART 5: browser gets success ONLY when a durable path delivered ────── */
    if ( ! $delivered ) {
        return new WP_Error( 'delivery_failed',
            'We received your request but could not deliver it. Please call us.',
            [ 'status' => 502 ] );
    }

    return rest_ensure_response( [ 'success' => true ] );
}

function ampy_ev_fmt_kr( $value ): string {
    return number_format( (float) $value, 0, '.', ' ' ) . ' SEK';
}


/* ==========================================================================
   2. ADMIN METABOX
   ========================================================================== */

add_action( 'add_meta_boxes', function () {
    add_meta_box(
        'ampy_ev_calc_settings',
        'EV Charging Calculator — Settings',
        'ampy_ev_calc_render_metabox',
        'lead-magnet', 'normal', 'high'
    );
} );

function ampy_ev_calc_render_metabox( WP_Post $post ): void {
    if ( AMPY_EV_CALC_POST_ID > 0 && $post->ID !== AMPY_EV_CALC_POST_ID ) return;

    wp_nonce_field( 'ampy_ev_calc_save_' . $post->ID, '_ampy_ev_calc_nonce' );

    $webhook_url      = get_post_meta( $post->ID, '_ampy_ev_calc_webhook_url',    true );
    $notify_email     = get_post_meta( $post->ID, '_ampy_ev_calc_notify_email',   true );
    $delivery_fails   = (int) get_post_meta( $post->ID, '_ampy_ev_calc_delivery_failures', true );
    $delivery_lasterr = get_post_meta( $post->ID, '_ampy_ev_calc_last_delivery_error',     true );
    $default_car      = get_post_meta( $post->ID, '_ampy_ev_calc_default_car',    true );
    $default_charger  = get_post_meta( $post->ID, '_ampy_ev_calc_default_charger',true );
    $excel_id         = (int) get_post_meta( $post->ID, '_ampy_ev_calc_excel_id', true );
    $excel_filename   = $excel_id ? basename( get_attached_file( $excel_id ) ) : '';
    $excel_url        = $excel_id ? wp_get_attachment_url( $excel_id )         : '';
    $last_import      = get_post_meta( $post->ID, '_ampy_ev_calc_last_import',    true );
    $import_status    = get_post_meta( $post->ID, '_ampy_ev_calc_import_status',  true );
    $data_json        = get_post_meta( $post->ID, '_ampy_ev_calc_data',           true );
    $ev_models        = $data_json ? ( json_decode( $data_json, true )['EV_MODELS'] ?? [] ) : [];
    $chargers         = $data_json ? ( json_decode( $data_json, true )['CHARGERS']  ?? [] ) : [];
    $leads_json       = get_post_meta( $post->ID, '_ampy_ev_calc_leads',          true );
    $leads            = $leads_json ? json_decode( $leads_json, true ) : [];
    $status_ok        = ( strpos( $import_status ?? '', 'OK' ) !== false );
    ?>
    <style>
      #ampy_ev_calc_settings .ampy-mb { display:flex; flex-direction:column; gap:18px; padding:4px 0; }
      #ampy_ev_calc_settings .ampy-mb section { background:#f9f9f9; border:1px solid #ddd; border-radius:6px; padding:14px 16px; }
      #ampy_ev_calc_settings .ampy-mb h3 { margin:0 0 10px; font-size:13px; font-weight:600; border-bottom:1px solid #e5e5e5; padding-bottom:8px; }
      #ampy_ev_calc_settings .ampy-mb label { display:block; font-weight:600; font-size:12px; margin-bottom:4px; color:#444; }
      #ampy_ev_calc_settings .ampy-mb input[type=email], #ampy_ev_calc_settings .ampy-mb input[type=text] { width:100%; max-width:520px; }
      #ampy_ev_calc_settings .ampy-mb .ampy-row  { display:flex; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:6px; }
      #ampy_ev_calc_settings .ampy-mb .chip  { background:#e8f4fd; color:#1d5a8a; border-radius:4px; padding:3px 8px; font-size:11px; font-family:monospace; }
      #ampy_ev_calc_settings .ampy-mb .chips { display:flex; flex-wrap:wrap; gap:6px; margin-top:8px; }
      #ampy_ev_calc_settings .ampy-mb .badge { display:inline-block; padding:3px 9px; border-radius:4px; font-size:11px; font-weight:600; }
      #ampy_ev_calc_settings .ampy-mb .badge-ok  { background:#d4f7e7; color:#1a6b3c; }
      #ampy_ev_calc_settings .ampy-mb .badge-err { background:#fce8e8; color:#b91c1c; }
      #ampy_ev_calc_settings .ampy-mb .badge-info { background:#e8f4fd; color:#1d5a8a; }
      #ampy_ev_calc_settings .ampy-mb .hint { font-size:11px; color:#888; margin-top:4px; }
      #ampy_ev_calc_settings table.ampy-leads { width:100%; border-collapse:collapse; font-size:11px; margin-top:8px; }
      #ampy_ev_calc_settings table.ampy-leads th, #ampy_ev_calc_settings table.ampy-leads td { padding:5px 8px; text-align:left; border-bottom:1px solid #eee; }
      #ampy_ev_calc_settings table.ampy-leads th { background:#f0f0f0; font-weight:600; }
    </style>

    <div class="ampy-mb">

      <section>
        <h3>Lead Delivery</h3>
        <label for="ampy_ev_webhook_url">n8n Webhook URL <span class="badge badge-info">Priority</span></label>
        <input type="text" id="ampy_ev_webhook_url" name="ampy_ev_calc_webhook_url"
               value="<?= esc_attr( $webhook_url ) ?>"
               placeholder="https://your-n8n.com/webhook/..."
               style="max-width:560px;">
        <p class="hint">Full lead payload is posted as JSON. If empty, fallback email is used.</p>
        <div style="height:12px;"></div>
        <label for="ampy_ev_notify_email">Fallback notification email</label>
        <input type="email" id="ampy_ev_notify_email" name="ampy_ev_calc_notify_email"
               value="<?= esc_attr( $notify_email ) ?>"
               placeholder="<?= esc_attr( get_option( 'admin_email' ) ) ?>"
               style="max-width:400px;">

        <div style="height:12px;"></div>
        <?php if ( $delivery_fails > 0 ) : ?>
          <p class="hint">
            Delivery health:
            &nbsp;<span class="badge badge-err"><?= esc_html( $delivery_fails ) ?> failed deliver<?= $delivery_fails === 1 ? 'y' : 'ies' ?></span>
            <?php if ( $delivery_lasterr ) : ?>
              <br>Last error: <?= esc_html( $delivery_lasterr ) ?>
            <?php endif; ?>
          </p>
          <button type="submit" class="button" name="ampy_ev_calc_reset_delivery_fails" value="1"
                  style="margin-top:6px;">Reset delivery-failure counter</button>
        <?php else : ?>
          <p class="hint">Delivery health: <span class="badge badge-ok">no failures recorded</span></p>
        <?php endif; ?>
      </section>

      <section>
        <h3>Data Source — Excel File (.xlsx)</h3>
        <input type="hidden" id="ampy_ev_excel_id" name="ampy_ev_calc_excel_id"
               value="<?= esc_attr( $excel_id ?: '' ) ?>">
        <div class="ampy-row">
          <button type="button" class="button" id="ampy_ev_upload_btn">
            <?= $excel_id ? 'Replace Excel file' : 'Choose Excel file from Media Library' ?>
          </button>
          <?php if ( $excel_filename ) : ?>
            <span id="ampy_ev_excel_name" class="chip">📎 <?= esc_html( $excel_filename ) ?></span>
            <a href="<?= esc_url( $excel_url ) ?>" target="_blank" style="font-size:11px;">Open</a>
          <?php else : ?>
            <span id="ampy_ev_excel_name" style="font-size:11px;color:#888;">No file selected</span>
          <?php endif; ?>
        </div>
        <?php if ( $last_import ) : ?>
          <p class="hint">Last import: <?= esc_html( $last_import ) ?>
            <?php if ( $import_status ) : ?>
              &nbsp;<span class="badge <?= $status_ok ? 'badge-ok' : 'badge-err' ?>"><?= esc_html( $import_status ) ?></span>
            <?php endif; ?>
          </p>
        <?php endif; ?>
        <?php if ( $ev_models || $chargers ) : ?>
          <p style="margin:10px 0 4px;font-size:11px;font-weight:600;color:#444;">EV Models:</p>
          <div class="chips">
            <?php foreach ( $ev_models as $m ) : ?>
              <span class="chip"><?= esc_html( $m['id'] ) ?> — <?= esc_html( $m['name'] ) ?></span>
            <?php endforeach; ?>
          </div>
          <p style="margin:10px 0 4px;font-size:11px;font-weight:600;color:#444;">Chargers:</p>
          <div class="chips">
            <?php foreach ( $chargers as $c ) : ?>
              <span class="chip"><?= esc_html( $c['id'] ) ?> — <?= esc_html( $c['name'] ) ?> (<?= esc_html( number_format( $c['priceSek'] ?? 0, 0, '.', ' ' ) ) ?> SEK)</span>
            <?php endforeach; ?>
          </div>
        <?php endif; ?>
      </section>

      <section>
        <h3>Defaults</h3>
        <?php if ( $ev_models ) : ?>
          <label for="ampy_ev_default_car">Default EV model (leave blank for first active):</label>
          <select id="ampy_ev_default_car" name="ampy_ev_calc_default_car" style="max-width:380px;margin-bottom:12px;">
            <option value="">— First active model —</option>
            <?php foreach ( $ev_models as $m ) :
                if ( empty( $m['available'] ) ) continue; ?>
              <option value="<?= esc_attr( $m['id'] ) ?>" <?= selected( $default_car, $m['id'], false ) ?>>
                <?= esc_html( $m['name'] ) ?>
              </option>
            <?php endforeach; ?>
          </select>
        <?php else : ?>
          <label for="ampy_ev_default_car">Default EV model ID (import Excel first for a dropdown):</label>
          <input type="text" id="ampy_ev_default_car" name="ampy_ev_calc_default_car"
                 value="<?= esc_attr( $default_car ) ?>" placeholder="e.g. tesla-model-y" style="max-width:380px;margin-bottom:12px;">
        <?php endif; ?>

        <?php if ( $chargers ) : ?>
          <label for="ampy_ev_default_charger">Default charger (leave blank for first active):</label>
          <select id="ampy_ev_default_charger" name="ampy_ev_calc_default_charger" style="max-width:380px;">
            <option value="">— First active charger —</option>
            <?php foreach ( $chargers as $c ) :
                if ( empty( $c['available'] ) ) continue; ?>
              <option value="<?= esc_attr( $c['id'] ) ?>" <?= selected( $default_charger, $c['id'], false ) ?>>
                <?= esc_html( $c['name'] ) ?>
              </option>
            <?php endforeach; ?>
          </select>
        <?php else : ?>
          <label for="ampy_ev_default_charger">Default charger ID:</label>
          <input type="text" id="ampy_ev_default_charger" name="ampy_ev_calc_default_charger"
                 value="<?= esc_attr( $default_charger ) ?>" placeholder="e.g. amina-s" style="max-width:380px;">
        <?php endif; ?>
      </section>

      <?php if ( $leads ) :
          $show = array_slice( $leads, 0, 20 ); ?>
      <section>
        <h3>Recent Leads (<?= count( $leads ) ?> total)</h3>
        <table class="ampy-leads">
          <thead><tr><th>Time</th><th>Type</th><th>Name</th><th>Email</th><th>Car</th><th>Charger</th><th>Net cost</th></tr></thead>
          <tbody>
            <?php foreach ( $show as $lead ) : ?>
            <tr>
              <td><?= esc_html( $lead['time']             ?? '' ) ?></td>
              <td><?= esc_html( $lead['type']             ?? '' ) ?></td>
              <td><?= esc_html( $lead['contact']['name']  ?? '—' ) ?></td>
              <td><?= esc_html( $lead['contact']['email'] ?? '—' ) ?></td>
              <td><?= esc_html( $lead['car']              ?? '—' ) ?></td>
              <td><?= esc_html( $lead['charger']          ?? '—' ) ?></td>
              <td><?= ! empty( $lead['net'] ) ? esc_html( number_format( $lead['net'], 0, '.', ' ' ) . ' SEK' ) : '—' ?></td>
            </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
      </section>
      <?php endif; ?>

    </div>

    <script>
    (function($){
        var frame;
        $('#ampy_ev_upload_btn').on('click', function(e){
            e.preventDefault();
            if (frame) { frame.open(); return; }
            frame = wp.media({ title:'Choose Excel file', button:{text:'Use this file'}, multiple:false, library:{type:''} });
            frame.on('select', function(){
                var att = frame.state().get('selection').first().toJSON();
                $('#ampy_ev_excel_id').val(att.id);
                $('#ampy_ev_excel_name').text('📎 ' + att.filename);
                $('#ampy_ev_upload_btn').text('Replace Excel file');
            });
            frame.open();
        });
    }(jQuery));
    </script>
    <?php
}


/* ==========================================================================
   3. SAVE POST
   ========================================================================== */

add_action( 'save_post_lead-magnet', function ( int $post_id, WP_Post $post, bool $update ) {
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( wp_is_post_revision( $post_id ) )                return;
    if ( ! isset( $_POST['_ampy_ev_calc_nonce'] ) )       return;
    if ( ! wp_verify_nonce( $_POST['_ampy_ev_calc_nonce'], 'ampy_ev_calc_save_' . $post_id ) ) return;
    if ( ! current_user_can( 'edit_post', $post_id ) )    return;
    if ( AMPY_EV_CALC_POST_ID > 0 && $post_id !== AMPY_EV_CALC_POST_ID ) return;

    update_post_meta( $post_id, '_ampy_ev_calc_webhook_url',
        esc_url_raw( $_POST['ampy_ev_calc_webhook_url'] ?? '' ) );
    update_post_meta( $post_id, '_ampy_ev_calc_notify_email',
        sanitize_email( $_POST['ampy_ev_calc_notify_email'] ?? '' ) );
    update_post_meta( $post_id, '_ampy_ev_calc_default_car',
        sanitize_text_field( $_POST['ampy_ev_calc_default_car'] ?? '' ) );
    update_post_meta( $post_id, '_ampy_ev_calc_default_charger',
        sanitize_text_field( $_POST['ampy_ev_calc_default_charger'] ?? '' ) );

    // PART 5: admin can clear the delivery-failure counter from the metabox.
    if ( ! empty( $_POST['ampy_ev_calc_reset_delivery_fails'] ) ) {
        delete_post_meta( $post_id, '_ampy_ev_calc_delivery_failures' );
        delete_post_meta( $post_id, '_ampy_ev_calc_last_delivery_error' );
    }

    $new_id = absint( $_POST['ampy_ev_calc_excel_id'] ?? 0 );
    $old_id = (int) get_post_meta( $post_id, '_ampy_ev_calc_excel_id', true );
    update_post_meta( $post_id, '_ampy_ev_calc_excel_id', $new_id );
    if ( $new_id && $new_id !== $old_id ) {
        ampy_ev_calc_parse_excel( $post_id, $new_id );
    }
}, 10, 3 );


/* ==========================================================================
   4. EXCEL PARSER
   Reads: EVModels | Chargers | PriceAreas | SystemCoefficients | Advanced
   Outputs JSON → window.AmpyEvCalcData
   ========================================================================== */

function ampy_ev_calc_parse_excel( int $post_id, int $attachment_id ): void {
    $file = get_attached_file( $attachment_id );
    if ( ! $file || ! file_exists( $file ) ) {
        ampy_ev_calc_set_import_status( $post_id, 'Error: file not found on server.' ); return;
    }
    if ( strtolower( pathinfo( $file, PATHINFO_EXTENSION ) ) !== 'xlsx' ) {
        ampy_ev_calc_set_import_status( $post_id, 'Error: only .xlsx files are supported.' ); return;
    }
    if ( ! class_exists( 'ZipArchive' ) ) {
        ampy_ev_calc_set_import_status( $post_id, 'Error: PHP ZipArchive extension unavailable.' ); return;
    }

    try {
        $zip = new ZipArchive();
        if ( true !== $zip->open( $file ) ) {
            throw new RuntimeException( 'Could not open .xlsx (invalid zip archive).' );
        }

        $shared    = ampy_ev_calc_parse_shared_strings( $zip );
        $sheet_map = ampy_ev_calc_build_sheet_map( $zip );

        $read = fn( string $name ) => isset( $sheet_map[$name] )
            ? ampy_ev_calc_read_sheet( $zip, $sheet_map[$name], $shared )
            : [];

        $EV_MODELS = ampy_ev_calc_parse_ev_models( $read( 'EVModels' ) );
        $CHARGERS  = ampy_ev_calc_parse_chargers(  $read( 'Chargers' ) );
        $REGIONS   = ampy_ev_calc_parse_price_areas( $read( 'PriceAreas' ) );
        $RATES     = ampy_ev_calc_parse_system_coefficients( $read( 'SystemCoefficients' ) );
        $ADVANCED  = ampy_ev_calc_parse_advanced( $read( 'Advanced' ) );

        $zip->close();

        $defaultRegion = 'SE3';
        foreach ( $REGIONS as $code => $r ) {
            if ( ! empty( $r['_is_default'] ) ) { $defaultRegion = $code; break; }
        }
        foreach ( $REGIONS as &$r ) unset( $r['_is_default'] );
        unset( $r );

        $ev_count = count( $EV_MODELS );
        $ch_count = count( $CHARGERS );

        // HARD failure: an empty import must NOT clobber previously-good data.
        // A working calculator needs at least one EV model AND one charger;
        // 0 of either means the upload was unreadable (wrong sheet names, all
        // inlineStr the old parser dropped, header typo, etc.). Surface a RED
        // error (status must NOT contain "OK") and keep the existing dataset.
        if ( $ev_count === 0 || $ch_count === 0 ) {
            ampy_ev_calc_set_import_status( $post_id,
                "Error: import read {$ev_count} EV model" . ( $ev_count !== 1 ? 's' : '' ) .
                " and {$ch_count} charger" . ( $ch_count !== 1 ? 's' : '' ) .
                '. Check sheet names/headers. Previous data kept — not overwritten.' );
            return;
        }

        $data = [
            'EV_MODELS'         => array_values( $EV_MODELS ),
            'CHARGERS'          => array_values( $CHARGERS ),
            'REGIONS'           => $REGIONS,
            'RATES'             => $RATES,
            'ADVANCED_DEFAULTS' => $ADVANCED,
            'defaultRegion'     => $defaultRegion,
        ];

        update_post_meta( $post_id, '_ampy_ev_calc_data',
            wp_json_encode( $data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) );

        ampy_ev_calc_set_import_status( $post_id,
            "OK — {$ev_count} EV model" . ( $ev_count !== 1 ? 's' : '' ) .
            ", {$ch_count} charger" . ( $ch_count !== 1 ? 's' : '' ) . ' imported.' );

    } catch ( Throwable $e ) {
        // On exception, also leave any previously-good data untouched.
        ampy_ev_calc_set_import_status( $post_id, 'Error: ' . $e->getMessage() . ' Previous data kept.' );
    }
}


/* ── Parser helpers (shared pattern with battery calc) ─────────────────── */

function ampy_ev_calc_set_import_status( int $post_id, string $msg ): void {
    update_post_meta( $post_id, '_ampy_ev_calc_import_status', $msg );
    update_post_meta( $post_id, '_ampy_ev_calc_last_import',   current_time( 'mysql' ) );
}

function ampy_ev_calc_col_idx( string $col ): int {
    $col = strtoupper( $col ); $idx = 0;
    for ( $i = 0, $len = strlen( $col ); $i < $len; $i++ ) {
        $idx = $idx * 26 + ( ord( $col[$i] ) - 64 );
    }
    return $idx - 1;
}

function ampy_ev_calc_parse_shared_strings( ZipArchive $zip ): array {
    $xml = $zip->getFromName( 'xl/sharedStrings.xml' );
    if ( ! $xml ) return [];
    $ss = new SimpleXMLElement( $xml ); $out = [];
    foreach ( $ss->si as $si ) {
        if ( isset( $si->t ) ) { $out[] = (string) $si->t; }
        elseif ( isset( $si->r ) ) { $t = ''; foreach ( $si->r as $r ) $t .= (string) $r->t; $out[] = $t; }
        else { $out[] = ''; }
    }
    return $out;
}

function ampy_ev_calc_build_sheet_map( ZipArchive $zip ): array {
    $wb_xml   = $zip->getFromName( 'xl/workbook.xml' );
    $rels_xml = $zip->getFromName( 'xl/_rels/workbook.xml.rels' );
    if ( ! $wb_xml || ! $rels_xml ) return [];
    $wb   = new SimpleXMLElement( $wb_xml );
    $rels = new SimpleXMLElement( $rels_xml );
    $rid_map = [];
    foreach ( $rels->Relationship as $rel ) {
        // Normalise targets so BOTH relative ('worksheets/sheet1.xml', xlsxwriter)
        // and absolute ('/xl/worksheets/sheet1.xml', openpyxl) resolve against the
        // zip's 'xl/'-rooted entries.
        $t   = ltrim( (string) $rel['Target'], '/' );
        $path = ( strpos( $t, 'xl/' ) === 0 ) ? $t : 'xl/' . $t;
        $rid_map[ (string) $rel['Id'] ] = $path;
    }
    $map = [];
    foreach ( $wb->sheets->sheet as $sheet ) {
        $rId = (string) $sheet->attributes( 'r', true )->id;
        if ( isset( $rid_map[$rId] ) ) $map[ (string) $sheet['name'] ] = $rid_map[$rId];
    }
    return $map;
}

function ampy_ev_calc_read_sheet( ZipArchive $zip, string $path, array $shared ): array {
    $xml = $zip->getFromName( $path );
    if ( ! $xml ) return [];
    $ws = new SimpleXMLElement( $xml ); $rows = [];
    foreach ( $ws->sheetData->row as $row ) {
        $ri = (int) $row['r'] - 1; $rd = [];
        foreach ( $row->c as $cell ) {
            $col = ampy_ev_calc_col_idx( preg_replace( '/\d/', '', (string) $cell['r'] ) );
            $t   = (string) $cell['t']; $v = (string) $cell->v;
            if ( $t === 's' ) {
                $v = $shared[ (int) $v ] ?? '';
            } elseif ( $t === 'b' ) {
                $v = $v === '1' ? 'TRUE' : 'FALSE';
            } elseif ( $t === 'inlineStr' ) {
                // Inline strings live in <is> (no <v>): read <is><t> plus any
                // concatenated <is><r><t> rich-text runs (openpyxl exports).
                $v = '';
                if ( isset( $cell->is ) ) {
                    if ( isset( $cell->is->t ) ) $v .= (string) $cell->is->t;
                    if ( isset( $cell->is->r ) ) {
                        foreach ( $cell->is->r as $run ) $v .= (string) $run->t;
                    }
                }
            }
            while ( count( $rd ) <= $col ) $rd[] = '';
            $rd[$col] = $v;
        }
        $rows[$ri] = $rd;
    }
    ksort( $rows );
    return array_values( $rows );
}

function ampy_ev_calc_header_map( array $rows ): array {
    return array_flip( $rows[0] ?? [] );
}


/* ── Sheet-specific parsers ─────────────────────────────────────────────── */

function ampy_ev_calc_parse_ev_models( array $rows ): array {
    $col    = ampy_ev_calc_header_map( $rows );
    $models = [];
    for ( $i = 2; $i < count( $rows ); $i++ ) {
        $r  = $rows[$i];
        $id = trim( $r[ $col['model_id'] ] ?? '' );
        if ( ! $id ) continue;

        $models[$id] = [
            'id'                    => $id,
            'name'                  => trim( $r[ $col['name'] ]        ?? '' ),
            'description'           => trim( $r[ $col['description'] ] ?? '' ),
            'badge'                 => trim( $r[ $col['badge'] ]       ?? '' ) ?: null,
            'available'             => strtolower( $r[ $col['active'] ] ?? '' ) === 'true',
            'efficiencyKwhPer10km'  => (float)( $r[ $col['efficiency_kwh_per_10km'] ] ?? 1.70 ),
            'onboardAcKw'           => (float)( $r[ $col['onboard_ac_kw'] ]           ?? 11 ),
            '_sort'                 => (int)( $r[ $col['sort_order'] ] ?? 999 ),
        ];
    }
    uasort( $models, fn( $a, $b ) => $a['_sort'] <=> $b['_sort'] );
    foreach ( $models as &$m ) unset( $m['_sort'] );
    unset( $m );
    return $models;
}

function ampy_ev_calc_parse_chargers( array $rows ): array {
    $col      = ampy_ev_calc_header_map( $rows );
    $chargers = [];
    for ( $i = 2; $i < count( $rows ); $i++ ) {
        $r  = $rows[$i];
        $id = trim( $r[ $col['charger_id'] ] ?? '' );
        if ( ! $id ) continue;

        // `offert` boxes (e.g. Zaptec Pro for BRF/företag) carry NO price — they
        // route to a manual quote. Keep them when offert=true even though
        // price_sek is blank; otherwise a blank price means a truly-empty/placeholder
        // row that must be skipped (preserves the old hardening).
        $offert    = strtolower( trim( (string) ( $r[ $col['offert'] ] ?? '' ) ) ) === 'true';
        $price_raw = (string) ( $r[ $col['price_sek'] ]       ?? '' );
        $gross_raw = (string) ( $r[ $col['gross_price_sek'] ] ?? '' );
        $price     = (float) $price_raw;
        if ( ! $price && ! $offert ) continue;

        $chargers[$id] = [
            'id'            => $id,
            'name'          => trim( $r[ $col['name'] ]        ?? '' ),
            'description'   => trim( $r[ $col['description'] ] ?? '' ),
            'badge'         => trim( $r[ $col['badge'] ]       ?? '' ) ?: null,
            'maxPowerKw'    => (float)( $r[ $col['max_power_kw'] ] ?? 11 ),
            // price_sek is the NET price (after Grön Teknik); gross_price_sek is the
            // pre-deduction gross. Offert boxes leave both null (no price quoted).
            'priceSek'      => ( $price_raw === '' ) ? null : (int) round( $price ),
            'grossPriceSek' => ( $gross_raw === '' ) ? null : (int) round( (float) $gross_raw ),
            'slug'          => trim( $r[ $col['learn_more_url'] ] ?? '#' ),
            'available'     => strtolower( $r[ $col['active'] ] ?? '' ) === 'true',
            'offertOnly'    => $offert,
            '_sort'         => (int)( $r[ $col['sort_order'] ] ?? 999 ),
        ];
    }
    uasort( $chargers, fn( $a, $b ) => $a['_sort'] <=> $b['_sort'] );
    foreach ( $chargers as &$c ) unset( $c['_sort'] );
    unset( $c );
    return $chargers;
}

function ampy_ev_calc_parse_price_areas( array $rows ): array {
    $col     = ampy_ev_calc_header_map( $rows );
    $regions = [];
    for ( $i = 2; $i < count( $rows ); $i++ ) {
        $r    = $rows[$i];
        $code = trim( $r[ $col['area_code'] ] ?? '' );
        if ( ! $code ) continue;
        // homeRateOptimizedSekPerKwh: per-zone scheduled-charging (optimised) rate.
        // New PriceAreas column. When absent/blank, fall back to ~88% of the flat
        // home rate so old data never produces a NaN/0 optimised bar downstream
        // (mirrors the engine's `homeRate * 0.88` safe fallback).
        $home_rate = (float)( $r[ $col['home_rate_sek_per_kwh'] ] ?? 2.20 );
        $opt_raw   = (string) ( $r[ $col['home_rate_optimized_sek_per_kwh'] ] ?? '' );
        $opt_rate  = ( $opt_raw === '' ) ? round( $home_rate * 0.88, 2 ) : (float) $opt_raw;
        $regions[$code] = [
            'label'                      => trim( $r[ $col['name'] ] ?? $code ),
            'homeRateSekPerKwh'          => $home_rate,
            'homeRateOptimizedSekPerKwh' => $opt_rate,
            '_is_default'                => strtolower( $r[ $col['is_default'] ] ?? '' ) === 'true',
        ];
    }
    if ( empty( $regions ) ) {
        $regions = [
            'SE1' => [ 'label' => 'SE1 – Norra Sverige',       'homeRateSekPerKwh' => 1.45, 'homeRateOptimizedSekPerKwh' => 1.05, '_is_default' => false ],
            'SE2' => [ 'label' => 'SE2 – Norra Mellansverige', 'homeRateSekPerKwh' => 1.60, 'homeRateOptimizedSekPerKwh' => 1.15, '_is_default' => false ],
            'SE3' => [ 'label' => 'SE3 – Södra Mellansverige', 'homeRateSekPerKwh' => 2.20, 'homeRateOptimizedSekPerKwh' => 1.35, '_is_default' => true  ],
            'SE4' => [ 'label' => 'SE4 – Södra Sverige',       'homeRateSekPerKwh' => 2.60, 'homeRateOptimizedSekPerKwh' => 1.45, '_is_default' => false ],
        ];
    }
    return $regions;
}

function ampy_ev_calc_parse_system_coefficients( array $rows ): array {
    $col   = ampy_ev_calc_header_map( $rows );
    $map   = [
        'horizon_years'                    => 'horizonYears',
        'public_ac_rate_sek_per_kwh'       => 'publicAcRateSekPerKwh',
        'public_dc_rate_sek_per_kwh'       => 'publicDcRateSekPerKwh',
        'charger_efficiency_pct'           => 'chargerEfficiencyPct',
        'gron_teknik_pct'                  => 'gronTeknikRate',
        'gron_teknik_cap_per_applicant_sek'=> 'gronTeknikCapPerApplicant',
        'max_applicants'                   => 'maxApplicants',
        'uncertainty_pct'                  => 'uncertaintyBand',
    ];
    $rates = [
        'horizonYears'             => 10,
        'publicAcRateSekPerKwh'    => 4.50,
        'publicDcRateSekPerKwh'    => 5.99,
        'chargerEfficiencyPct'     => 0.90,
        'gronTeknikRate'           => 0.485,
        'gronTeknikCapPerApplicant'=> 50000,
        'maxApplicants'            => 2,
        'uncertaintyBand'          => 0.10,
    ];
    for ( $i = 2; $i < count( $rows ); $i++ ) {
        $r   = $rows[$i];
        $key = trim( $r[ $col['key'] ] ?? '' );
        $val = $r[ $col['value'] ]     ?? '';
        if ( $val === '' || ! isset( $map[$key] ) ) continue;
        $rates[ $map[$key] ] = in_array( $key, [ 'gron_teknik_cap_per_applicant_sek', 'max_applicants', 'horizon_years' ], true )
            ? (int) round( (float) $val )
            : (float) $val;
    }
    return $rates;
}

function ampy_ev_calc_parse_advanced( array $rows ): array {
    $col      = ampy_ev_calc_header_map( $rows );
    $map      = [
        'annual_km'           => 'annualKm',
        'public_charging_pct' => 'publicChargingPct',
        'public_charging_type'=> 'publicChargingType',
    ];
    $defaults = [ 'annualKm' => 15000, 'publicChargingPct' => 50, 'publicChargingType' => 'dc' ];
    for ( $i = 2; $i < count( $rows ); $i++ ) {
        $r   = $rows[$i];
        $key = trim( $r[ $col['key'] ]     ?? '' );
        $val = $r[ $col['default'] ] ?? '';
        if ( $val === '' || ! isset( $map[$key] ) ) continue;
        $js_key = $map[$key];
        $defaults[$js_key] = ( $js_key === 'publicChargingType' ) ? (string) $val : (float) $val;
    }
    return $defaults;
}


/* ==========================================================================
   5. RENDER FUNCTION
   ========================================================================== */

function ampy_render_ev_lead_magnet( $id_or_slug ): string {
    if ( is_numeric( $id_or_slug ) ) {
        $post = get_post( (int) $id_or_slug );
    } else {
        $posts = get_posts( [
            'post_type'      => 'lead-magnet',
            'name'           => sanitize_title( (string) $id_or_slug ),
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'no_found_rows'  => true,
        ] );
        $post = $posts[0] ?? null;
    }
    if ( ! $post || $post->post_type !== 'lead-magnet' || $post->post_status !== 'publish' ) {
        return '';
    }

    $post_id = $post->ID;

    $data_json = get_post_meta( $post_id, '_ampy_ev_calc_data', true );
    $calc_data = $data_json ? json_decode( $data_json, true ) : [];

    $js_data = array_merge(
        [
            'EV_MODELS'         => [],
            'CHARGERS'          => [],
            'REGIONS'           => (object) [],
            'RATES'             => (object) [],
            'ADVANCED_DEFAULTS' => (object) [],
            'defaultRegion'     => 'SE3',
        ],
        $calc_data,
        [
            'postId'  => $post_id,
            'restUrl' => rest_url( 'ampy-ev-calc/v1' ),
            'nonce'   => wp_create_nonce( 'wp_rest' ),
        ]
    );

    $default_car_id     = get_post_meta( $post_id, '_ampy_ev_calc_default_car',     true );
    $default_charger_id = get_post_meta( $post_id, '_ampy_ev_calc_default_charger', true );

    $mono_local_path = ABSPATH . 'wp-content/uploads/fonts/JetBrainsMono-VariableFont_wght.woff2';
    $mono_local_url  = home_url( '/wp-content/uploads/fonts/JetBrainsMono-VariableFont_wght.woff2' );
    $font_html = file_exists( $mono_local_path )
        ? '<style>@font-face{font-family:"JetBrains Mono";src:url("' . esc_url( $mono_local_url ) . '")format("woff2-variations");font-weight:100 800;font-style:normal;font-display:swap;}</style>'
        : '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap" rel="stylesheet">';

    ob_start();
    echo $font_html;
    ?>

<script>window.AmpyEvCalcData = <?= wp_json_encode( $js_data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES ) ?>;</script>

<!-- G4 font-scope: the prototype set 1rem=10px with a GLOBAL <style>html{font-size:62.5%}</style>.
     Emitting that on the host page leaks: every rem-based element on the surrounding
     WP/Bricks page would shrink to 62.5%. The whole calculator rem scale (tokens, type,
     spacing, radii) assumes 1rem=10px, so we re-anchor it on the component wrapper only.
     `font-size:62.5%` on .ampy-calc-outer leaves the host <html> root untouched; the
     calculator reads its own size from `.ampy-calc{font-size:var(--fs-md)}` and the
     fluid `--fs-*` clamps, which already mix cqi + px and degrade gracefully if a theme
     forces a different inherited size. The popover (appended to <body>, outside this
     scope) carries explicit px fallbacks for exactly this reason — see 02_styles.css. -->
<style>.ampy-calc-outer{font-size:62.5%;}</style>

<div class="ampy-calc-outer">
<div class="ampy-calc" id="ampyEvCalc"
     data-default-car-id="<?= esc_attr( $default_car_id ) ?>"
     data-default-charger-id="<?= esc_attr( $default_charger_id ) ?>">

  <div class="ampy-calc__container">

    <header class="ampy-calc__header">
      <span class="ampy-calc__header-label">Laddbox-kalkylator</span>
      <h1 class="ampy-calc__t-2xl">Hur mycket sparar du på att ladda hemma?</h1>
    </header>

    <section class="ampy-calc__main" aria-label="Laddbox-kalkylator">

      <!-- ── INPUTS CARD ──────────────────────────────────────────────── -->
      <div class="ampy-calc__card" aria-label="Inställningar">

        <div class="ampy-calc__tier ampy-calc__tier--primary">
          <span class="ampy-calc__tier-label">Din elbil och laddbox</span>

          <!-- Car model selector -->
          <div class="ampy-calc__field ampy-calc__field--prominent">
            <!-- a11y: was an orphan <label> (no native control to bind 'for' to —
                 the selector is a custom button/listbox). Now a <span> that the
                 selector button + listbox reference via aria-labelledby. -->
            <span class="ampy-calc__field-label-tiny" id="ampyEvCarLabel">Din elbil</span>
            <div class="ampy-calc__selector" id="ampyEvCarSelectorA" aria-expanded="false">
              <button type="button"
                      class="ampy-calc__selector-button ampy-calc__selector-button--prominent"
                      aria-haspopup="listbox" aria-labelledby="ampyEvCarLabel" id="ampyEvCarButtonA">
                <span class="ampy-calc__selector-img ampy-calc__selector-img--lg" id="ampyEvCarImgA" aria-hidden="true"></span>
                <span class="ampy-calc__selector-text">
                  <span class="ampy-calc__selector-name ampy-calc__selector-name--lg" id="ampyEvCarNameA">—</span>
                  <span class="ampy-calc__selector-best" id="ampyEvCarBestA">—</span>
                </span>
                <span id="ampyEvCarBadgeA"></span>
                <?= ampy_ev_chevron() ?>
              </button>
              <ul class="ampy-calc__selector-list" id="ampyEvCarListA" role="listbox" aria-labelledby="ampyEvCarLabel"></ul>
            </div>
          </div>

          <!-- Charger selector -->
          <div class="ampy-calc__field ampy-calc__field--prominent">
            <!-- a11y: orphan <label> → <span>, referenced via aria-labelledby. -->
            <span class="ampy-calc__field-label-tiny" id="ampyEvChargerLabel">Laddbox att installera</span>
            <div class="ampy-calc__selector" id="ampyEvChargerSelectorA" aria-expanded="false">
              <button type="button"
                      class="ampy-calc__selector-button ampy-calc__selector-button--prominent"
                      aria-haspopup="listbox" aria-labelledby="ampyEvChargerLabel" id="ampyEvChargerButtonA">
                <span class="ampy-calc__selector-img ampy-calc__selector-img--lg" id="ampyEvChargerImgA" aria-hidden="true"></span>
                <span class="ampy-calc__selector-text">
                  <span class="ampy-calc__selector-name ampy-calc__selector-name--lg" id="ampyEvChargerNameA">—</span>
                  <span class="ampy-calc__selector-best" id="ampyEvChargerBestA">—</span>
                </span>
                <span id="ampyEvChargerBadgeA"></span>
                <?= ampy_ev_chevron() ?>
              </button>
              <ul class="ampy-calc__selector-list" id="ampyEvChargerListA" role="listbox" aria-labelledby="ampyEvChargerLabel"></ul>
            </div>
          </div>
        </div><!-- /tier primary -->

        <div class="ampy-calc__tier ampy-calc__tier--modifiers">
          <span class="ampy-calc__tier-label">Dina körvanor</span>

          <!-- Annual km slider -->
          <!-- a11y: <label> here has no matching control (custom slider, not a
               native input), so 'for' is intentionally absent. Instead it gets
               an id and the slider references it via aria-labelledby. -->
          <div class="ampy-calc__field ampy-calc__field--prominent">
            <span class="ampy-calc__field-label-tiny" id="ampyEvKmLabel">Körsträcka per år</span>
            <span class="ampy-calc__value-prominent ampy-calc__t-mono" id="ampyEvKmDisplay">
              <span id="ampyEvKmValue">—</span><span class="ampy-calc__value-unit">km/år</span>
            </span>
            <div id="ampyEvKmContainer"></div>
          </div>

          <!-- Public % slider -->
          <!-- a11y: <label> replaced with <span>+id (no native control to bind
               'for' to). The slider references this via aria-labelledby. The
               tooltip button is excluded from the slider's name (see id below). -->
          <div class="ampy-calc__field ampy-calc__field--prominent">
            <span class="ampy-calc__field-label-tiny">
              <span id="ampyEvPctLabel">Andel offentlig laddning</span>
              <button type="button" class="ampy-calc__tip" aria-label="Mer info"
                      data-tip="Hur stor del av din laddning du gör publikt idag i stället för hemma. Kalkylen visar vad du sparar genom att flytta den hem.">i</button>
            </span>
            <span class="ampy-calc__value-prominent ampy-calc__t-mono" id="ampyEvPctDisplay">
              <span id="ampyEvPctValue">—</span><span class="ampy-calc__value-unit">%</span>
            </span>
            <div id="ampyEvPctContainer"></div>
          </div>

          <!-- Public type toggle -->
          <div class="ampy-calc__field">
            <div class="ampy-calc__field-row">
              <span class="ampy-calc__field-label">
                <!-- a11y: id on the text-only span so the toggle group's name
                     excludes the tooltip button. -->
                <span id="ampyEvPubTypeLabel">Typ av offentlig laddning</span>
                <button type="button" class="ampy-calc__tip" aria-label="Mer info"
                        data-tip="AC = långsam laddning vid parkering och köpcentrum (ca 4,50 kr/kWh). DC = snabbladdning längs vägen (ca 5,50 kr/kWh).">i</button>
              </span>
              <!-- a11y: each option is a native <button aria-pressed> — keyboard
                   operable (Enter/Space) and announced as a pressed/unpressed
                   toggle button. aria-pressed kept in sync in updatePublicTypeToggle. -->
              <div class="ampy-calc__toggle" role="group" aria-labelledby="ampyEvPubTypeLabel" id="ampyEvPublicType">
                <button type="button" class="ampy-calc__toggle-option" data-value="ac" aria-pressed="false">AC</button>
                <button type="button" class="ampy-calc__toggle-option" data-value="dc" aria-pressed="true">DC</button>
              </div>
            </div>
          </div>

          <!-- Region -->
          <div class="ampy-calc__field">
            <span class="ampy-calc__field-label">
              <span id="ampyEvRegionLabel">Elprisområde</span>
              <button type="button" class="ampy-calc__tip" aria-label="Mer info"
                      data-tip="Ditt elprisområde (SE1 norr–SE4 söder). Dyrare hemma-el ger något lägre besparing per kWh.">i</button>
            </span>
            <div class="ampy-calc__segmented" role="group" aria-labelledby="ampyEvRegionLabel" id="ampyEvRegion"></div>
          </div>

        </div><!-- /tier modifiers -->

      </div><!-- /.ampy-calc__card (inputs) -->

      <!-- ── RESULTS COLUMN ───────────────────────────────────────────── -->
      <div class="ampy-calc__result-stack">

        <!-- a11y: aria-live removed from the whole results card. The entire
             subtree (every tile, the monthly panel, breakdown HTML) was being
             announced on every keystroke, which flooded SR users. Replaced by
             a single polite, debounced status region (#ampyEvSrStatus) that
             announces ONLY the annual-saving headline after input settles. -->
        <div class="ampy-calc__card ampy-calc__card--surface" aria-label="Resultat">

          <!-- Hero: ANNUAL saving (dominant) — now the first element in the card
               (the ROI "Med/Utan investering" toggle was removed; the investment
               is always included). -->
          <div class="ampy-calc__hero15">
            <span class="ampy-calc__hero15-eyebrow">Du sparar per år</span>
            <span class="ampy-calc__hero15-value ampy-calc__t-mono">
              ≈ <span id="ampyEvAnnualSaving">—</span>
              <span class="ampy-calc__hero15-unit">kr/år</span>
            </span>
            <span class="ampy-calc__hero15-sub" id="ampyEvHeroAnnualSub">
              jämfört med fortsatt publik laddning
            </span>
          </div>

          <!-- a11y: single polite, debounced live region. Announces only the
               headline annual saving once input settles (see engine.js
               announceHeadline). Visually hidden; not aria-hidden. -->
          <div class="ampy-calc__sr-only" id="ampyEvSrStatus" role="status" aria-live="polite" aria-atomic="true"></div>

          <!-- Secondary stat tiles -->
          <div class="ampy-calc__trio" id="ampyEvTrio">
            <div class="ampy-calc__trio-tile" id="ampyEvCumulativeTile">
              <span class="ampy-calc__trio-label" id="ampyEvCumulativeLabel">Sparar på 10 år</span>
              <span class="ampy-calc__trio-value ampy-calc__t-mono">
                <span id="ampyEvCumulativeValue">—</span><span class="ampy-calc__trio-unit">kr</span>
              </span>
              <span class="ampy-calc__trio-sub" id="ampyEvHero10Sub">—</span>
            </div>

            <div class="ampy-calc__trio-tile" id="ampyEvNetPayTile">
              <span class="ampy-calc__trio-label">Att betala<sup>*</sup></span>
              <span class="ampy-calc__trio-value ampy-calc__t-mono">
                <span id="ampyEvNetPay">—</span><span class="ampy-calc__trio-unit">kr</span>
              </span>
              <span class="ampy-calc__trio-sub" id="ampyEvNetPaySub">—</span>
            </div>
          </div>

          <!-- 3-4: divider removed — the monthly panel's own subtle bg separates
               it from the trio, so a hairline here is a redundant third rule. -->

          <!-- Monthly cost comparison: publik vs hemma (replaces the payback chart).
               monthlyPublic / monthlyHome = publicKwh × rate ÷ 12; saving = the
               difference. Reconciles to the annual hero (× 12). Renders for
               offert-only boxes too (segment-agnostic). -->
          <div class="ampy-calc__monthly" id="ampyEvMonthly">
            <div class="ampy-calc__monthly-head">
              <span class="ampy-calc__evidence-label">Din månadskostnad – publikt vs hemma</span>
            </div>
            <div class="ampy-calc__monthly-cols">
              <div class="ampy-calc__monthly-col ampy-calc__monthly-col--public">
                <span class="ampy-calc__monthly-col-label">Publik laddning idag</span>
                <span class="ampy-calc__monthly-col-value ampy-calc__monthly-col-value--public ampy-calc__t-mono">
                  <span id="ampyEvMonthlyPublic">—</span><span class="ampy-calc__monthly-col-unit">kr/mån</span>
                </span>
              </div>
              <div class="ampy-calc__monthly-col ampy-calc__monthly-col--home">
                <span class="ampy-calc__monthly-col-label">Hemma efter installation</span>
                <span class="ampy-calc__monthly-col-value ampy-calc__monthly-col-value--home ampy-calc__t-mono">
                  <span id="ampyEvMonthlyHome">—</span><span class="ampy-calc__monthly-col-unit">kr/mån</span>
                </span>
              </div>
              <!-- Third bar: scheduled / optimised home charging (owner decision D1).
                   Visually subordinate (lighter, dashed) to the solid home bar.
                   The headline annual saving is UNCHANGED — this is additive upside. -->
              <div class="ampy-calc__monthly-col ampy-calc__monthly-col--homeopt">
                <span class="ampy-calc__monthly-col-label">
                  Hemma, schemalagd
                  <button type="button" class="ampy-calc__tip" aria-label="Mer info"
                          data-tip="Din laddbox laddar när elen är som billigast — spotpriset är 30–60 % lägre på lågpristimmar. Det sänker din hemmakostnad ytterligare några procent. Beror på elavtal och elområde.">i</button>
                </span>
                <span class="ampy-calc__monthly-col-value ampy-calc__monthly-col-value--homeopt ampy-calc__t-mono">
                  <span id="ampyEvMonthlyHomeOpt">—</span><span class="ampy-calc__monthly-col-unit">kr/mån</span>
                </span>
              </div>
            </div>
            <div class="ampy-calc__monthly-delta" id="ampyEvMonthlyDelta">
              <span class="ampy-calc__monthly-delta-label">Du sparar</span>
              <span class="ampy-calc__monthly-delta-value ampy-calc__t-mono">
                <span id="ampyEvMonthlySaving">—</span><span class="ampy-calc__monthly-delta-unit">kr/mån</span>
              </span>
            </div>
          </div>

          <!-- Savings breakdown -->
          <div class="ampy-calc__evidence">
            <div class="ampy-calc__evidence-head">
              <span class="ampy-calc__evidence-label">Hur besparingen räknas</span>
            </div>
            <div id="ampyEvSavingsBreakdown" style="margin-top:var(--spacing-sm);"></div>
          </div>

          <hr class="ampy-calc__internal-divider">

          <!-- CTAs -->
          <div class="ampy-calc__cta-stack">

            <button type="button"
                    class="ampy-calc__btn ampy-calc__btn--primary ampy-calc__btn--lg ampy-calc__btn--block"
                    id="ampyEvCtaQuote">
              Få en laddbox-offert <?= ampy_ev_arrow_icon() ?>
            </button>

            <form class="ampy-calc__lead-form" id="ampyEvLeadForm" novalidate>
              <span class="ampy-calc__t-small" style="color:var(--on-surface-text);">
                Vår laddbox-expert hör av sig med ett offertförslag, oftast inom en arbetsdag.
              </span>
              <div class="ampy-calc__lead-form-grid">
                <div class="ampy-calc__field">
                  <label class="ampy-calc__field-label" for="ampyEvLeadName">Namn</label>
                  <input type="text"  class="ampy-calc__input" id="ampyEvLeadName"  required autocomplete="name">
                  <span class="ampy-calc__input-error" id="ampyEvLeadNameError"></span>
                </div>
                <div class="ampy-calc__field">
                  <label class="ampy-calc__field-label" for="ampyEvLeadEmail">E-post</label>
                  <input type="email" class="ampy-calc__input" id="ampyEvLeadEmail" required autocomplete="email">
                  <span class="ampy-calc__input-error" id="ampyEvLeadEmailError"></span>
                </div>
                <div class="ampy-calc__field">
                  <label class="ampy-calc__field-label" for="ampyEvLeadPhone">Telefon</label>
                  <input type="tel"   class="ampy-calc__input" id="ampyEvLeadPhone" required autocomplete="tel" inputmode="tel">
                  <span class="ampy-calc__input-error" id="ampyEvLeadPhoneError"></span>
                </div>
                <div class="ampy-calc__field">
                  <label class="ampy-calc__field-label" for="ampyEvLeadZip">Postnummer</label>
                  <input type="text"  class="ampy-calc__input" id="ampyEvLeadZip"   required autocomplete="postal-code" inputmode="numeric">
                  <span class="ampy-calc__input-error" id="ampyEvLeadZipError"></span>
                </div>
              </div>
              <!-- GDPR: honeypot. Visually hidden + off the a11y tree + not
                   tabbable + autocomplete off. A real human never fills it; the
                   server rejects any submission where it is non-empty. Kept
                   inside the form so its value lands in buildPayload. -->
              <div class="ampy-calc__hp" aria-hidden="true">
                <label for="ampyEvLeadCompany">Lämna detta fält tomt</label>
                <input type="text" id="ampyEvLeadCompany" name="company"
                       tabindex="-1" autocomplete="off">
              </div>

              <!-- GDPR: required, UNTICKED, granular consent. Separate from the
                   submit action. Article-13 micro-notice + privacy link.
                   PLACEHOLDER href="/integritetspolicy" — Ampy must point this
                   at the live policy before go-live. -->
              <div class="ampy-calc__field ampy-calc__consent">
                <label class="ampy-calc__consent-row" for="ampyEvLeadConsent">
                  <input type="checkbox" class="ampy-calc__consent-check"
                         id="ampyEvLeadConsent" required
                         aria-describedby="ampyEvLeadConsentNotice ampyEvLeadConsentError">
                  <span class="ampy-calc__consent-text" id="ampyEvLeadConsentNotice">
                    Jag samtycker till att Ampy lagrar och behandlar mina
                    kontakt- och kalkyluppgifter för att kontakta mig med en offert.
                    Du kan när som helst återkalla samtycket. Se vår
                    <a href="/integritetspolicy" target="_blank" rel="noopener">integritetspolicy</a>
                    för hur vi hanterar dina uppgifter och dina rättigheter.
                  </span>
                </label>
                <span class="ampy-calc__input-error" id="ampyEvLeadConsentError"></span>
              </div>

              <button type="submit" class="ampy-calc__btn ampy-calc__btn--primary ampy-calc__btn--block" id="ampyEvLeadSubmit">
                <span id="ampyEvLeadSubmitLabel">Skicka offertförfrågan</span>
              </button>
            </form>

            <div class="ampy-calc__lead-form-success" id="ampyEvLeadSuccess" role="status">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
              <span><strong>Tack!</strong> En expert återkommer inom 24 timmar med en exakt offert. Du får kalkylen mailad till dig.</span>
            </div>

            <div class="ampy-calc__lead-form-error" id="ampyEvLeadErrorBox" role="alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <span>Något gick fel. Ring oss på <a href="tel:+46102657979" style="color:inherit;text-decoration:underline;">010-265 79 79</a> så hjälper vi dig direkt.</span>
            </div>

            <!-- 8c: the whole phrase is ONE inline label so hover/focus draws a
                 single continuous underline (incl. the dynamic box name, any
                 length); the arrow is a separate flex sibling and never underlines.
                 Also promoted to a bordered secondary button (Part 3 / 3-5) so the
                 two CTAs read as a deliberate primary/secondary pair. -->
            <a class="ampy-calc__btn-link ampy-calc__btn-link--center ampy-calc__btn-link--bordered" id="ampyEvProductLink" href="#" target="_self">
              <span class="ampy-calc__btn-link-label">Läs mer om <span id="ampyEvProductLinkName">laddboxen</span></span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>

          </div><!-- /.ampy-calc__cta-stack -->

        </div><!-- /.ampy-calc__card--surface -->

        <!-- Methodology -->
        <section class="ampy-calc__methodology" aria-label="Så har vi räknat">
          <details class="ampy-calc__disclosure">
            <summary class="ampy-calc__disclosure-summary ampy-calc__t-subheading"
                     style="color:var(--text-primary);font-weight:600;">
              Så har vi räknat
            </summary>
            <div class="ampy-calc__disclosure-content">
              <div class="ampy-calc__methodology-stack" id="ampyEvMethodologyStack"></div>
              <div class="ampy-calc__disclaimers">
                <p>
                  <strong style="color:var(--text-primary);">Så här läser du kalkylen.</strong>
                  Siffrorna bygger på publik branschdata för 2025–2026. Ditt verkliga utfall beror på
                  hur du kör, hur du laddar och hur elpriset utvecklas. Kalkylen är en uppskattning —
                  inte ett erbjudande och inte bindande för Ampy. Vill du ha ett exakt pris, begär en offert.
                </p>
                <p>* "Att betala" är ungefärligt pris inkl. installation och moms, med Grön Teknik-avdraget redan avdraget. Slutpriset beror på ditt hem och din installation.</p>
              </div>
            </div>
          </details>
        </section>

      </div><!-- /.ampy-calc__result-stack -->

    </section><!-- /.ampy-calc__main -->

  </div><!-- /.ampy-calc__container -->

</div><!-- /#ampyEvCalc -->
</div><!-- /.ampy-calc-outer -->

    <?php
    return ob_get_clean();
}


/* ==========================================================================
   6. SHORTCODE
   [ampy_ev_lead_magnet slug="laddboxkalkylator"]
   [ampy_ev_lead_magnet id="56467"]
   ========================================================================== */

add_shortcode( 'ampy_ev_lead_magnet', function ( $atts ): string {
    $atts       = shortcode_atts( [ 'slug' => '', 'id' => '' ], $atts, 'ampy_ev_lead_magnet' );
    $identifier = $atts['id'] ?: $atts['slug'];
    if ( ! $identifier ) return '';
    return ampy_render_ev_lead_magnet( $identifier );
} );