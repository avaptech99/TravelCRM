<?php

/**
 * CRM Integration for Ninja Forms (Booking Flights - Form ID 3)
 * This script sends form submissions to the Travel CRM.
 * It also creates a crm_debug.txt file in your WordPress root for troubleshooting.
 */

// Use the save_sub hook for maximum reliability
add_action( 'ninja_forms_save_sub', 'submit_to_travel_crm', 10, 1 );

function submit_to_travel_crm( $sub_id ) {
    // Get the submission object from Ninja Forms
    $sub = Ninja_Forms()->sub( $sub_id );
    $form_id = $sub->get_form_id();
    
    // 1. Only run for the "Booking Flights" form (ID 3)
    // Based on your dashboard screenshot, this is the correct ID.
    if ( $form_id != 3 ) {
        return;
    }

    // 2. Custom Logger (Creates/Updates a file called crm_debug.txt in your public_html)
    $log_file = ABSPATH . 'crm_debug.txt';
    $log_entry = "[" . date("Y-m-d H:i:s") . "] Processing Submission ID: " . $sub_id . PHP_EOL;
    file_put_contents($log_file, $log_entry, FILE_APPEND);

    // 3. Configuration
    $crm_url = 'https://your-crm-domain.com/api/external/lead'; // UPDATE THIS to your live CRM URL
    $api_key = 'crm-wp-integration-2026';

    // Get all field values
    $form_data = $sub->get_field_values();

    // 4. Map to CRM Schema (Using keys from your Ninja Forms settings)
    $payload = array(
        'contactPerson' => 'Website Lead', // Fallback name
        'contactNumber' => isset($form_data['phone_1710741985398']) ? $form_data['phone_1710741985398'] : '',
        'contactEmail'  => isset($form_data['email_1710741948527']) ? $form_data['email_1710741948527'] : '',
        'flightFrom'    => isset($form_data['from_1710741487545']) ? $form_data['from_1710741487545'] : '',
        'flightTo'      => isset($form_data['to_1710741556864']) ? $form_data['to_1710741556864'] : '',
        'travelDate'    => isset($form_data['departure_1710741636353']) ? $form_data['departure_1710741636353'] : '',
        'tripType'      => isset($form_data['listradio_1710745253292']) ? $form_data['listradio_1710745253292'] : 'one-way',
        'adults'        => isset($form_data['adults_12y_1712752891789']) ? $form_data['adults_12y_1712752891789'] : 0,
        'children'      => isset($form_data['children_2y_-_12y_1712752915056']) ? $form_data['children_2y_-_12y_1712752915056'] : 0,
        'infants'       => isset($form_data['infants_below_2y_1712752927823']) ? $form_data['infants_below_2y_1712752927823'] : 0,
        'class'         => isset($form_data['travellers_and_amp_class_1712754155672']) ? $form_data['travellers_and_amp_class_1712754155672'] : 'Economy',
        'requirements'  => "Direct Booking Inquiry from Website"
    );

    // Extract name from email if email is provided (anmol.sharma@gmail.com -> Anmol Sharma)
    if ( ! empty($payload['contactEmail']) && strpos($payload['contactEmail'], '@') !== false ) {
        $email_parts = explode('@', $payload['contactEmail']);
        $payload['contactPerson'] = ucwords( str_replace( array('.', '_', '-'), ' ', $email_parts[0] ) );
    }

    // 5. Send to CRM via POST
    $response = wp_remote_post( $crm_url, array(
        'method'    => 'POST',
        'headers'   => array(
            'Content-Type' => 'application/json',
            'X-API-KEY'    => $api_key,
        ),
        'body'      => json_encode( $payload ),
        'timeout'   => 15,
    ) );

    // 6. Log specific results to the debug file
    if ( is_wp_error( $response ) ) {
        $msg = "Error: " . $response->get_error_message() . PHP_EOL;
        file_put_contents($log_file, $msg, FILE_APPEND);
    } else {
        $status_code = wp_remote_retrieve_response_code( $response );
        $msg = "Success: Data sent to CRM. Status Code: " . $status_code . PHP_EOL;
        file_put_contents($log_file, $msg, FILE_APPEND);
    }
}
