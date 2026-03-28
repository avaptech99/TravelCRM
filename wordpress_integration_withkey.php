<?php
/**
 * Ultra-Simple CRM Pass-Through (v4.0)
 * This script just forwards the raw data to the CRM.
 * The CRM Backend now handles all the complex parsing.
 */

add_action( 'ninja_forms_after_submission', 'crm_simple_pass_through' );

function crm_simple_pass_through( $data ) {
    // 1. Only sync Form ID 3
    if ( $data['form_id'] != 3 ) return;

    // 2. CONFIG (PRESERVED)
    $crm_url = 'https://travelcrm-testing.onrender.com/api/external/lead'; 
    $api_key = 'crm-wp-integration-2026'; 

    // 3. One-line forwarder
    wp_remote_post( $crm_url, array(
        'method'    => 'POST',
        'headers'   => array('Content-Type' => 'application/json', 'X-API-KEY' => $api_key),
        'body'      => json_encode( $data ),
        'timeout'   => 20,
    ));
}
