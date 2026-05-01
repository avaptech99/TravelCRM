<?php
/**
 * Travel CRM - WordPress Ninja Forms Integration (v5.0)
 * Allows multiple Form IDs and logs detailed field data to /crm_debug.txt
 */

add_action( 'ninja_forms_after_submission', 'travelwindow_crm_send_v5' );

if ( ! function_exists( 'travelwindow_crm_send_v5' ) ) {
    function travelwindow_crm_send_v5( $data ) {

        // --- CONFIGURATION ---
        $crm_url = 'https://travelcrm-testing.onrender.com/api/external/lead';
        $api_key = 'crm-wp-integration-2026';
        
        // ADD OR CHANGE YOUR FORM IDs HERE
        $allowed_form_ids = array( 3, 5, 8 ); 

        // --- LOGGER SETUP ---
        $log_file = trailingslashit(ABSPATH) . 'crm_debug.txt';
        $debug_log = function($msg) use ($log_file) {
            file_put_contents($log_file, "[" . date("Y-m-d H:i:s") . "] " . $msg . "\n", FILE_APPEND);
        };

        // --- VALIDATION ---
        $form_id = is_object($data) && method_exists($data, 'get_id') ? $data->get_id() : (isset($data['form_id']) ? $data['form_id'] : 0);
        
        if ( !in_array($form_id, $allowed_form_ids) ) {
            // Uncomment the line below if you want to log every skipped form
            // $debug_log("Skipped: Form ID $form_id is not in the allowed list.");
            return;
        }

        $fields = isset($data['fields']) ? $data['fields'] : (is_array($data) ? $data : array());
        if (empty($fields)) {
            $debug_log("Error: No fields found for Form ID $form_id.");
            return;
        }

        // --- DATA PROCESSING ---
        $all_fields = array();

        foreach ( $fields as $f ) {
            if (is_object($f) && method_exists($f, 'get_setting')) {
                $key   = $f->get_setting('key');
                $label = $f->get_setting('label');
                $val   = $f->get_value();
            } else {
                $f_arr = (array)$f;
                $key   = isset($f_arr['key']) ? $f_arr['key'] : (isset($f_arr['id']) ? $f_arr['id'] : '');
                $label = isset($f_arr['label']) ? $f_arr['label'] : $key;
                $val   = isset($f_arr['value']) ? $f_arr['value'] : '';
            }

            if (empty($val)) continue;
            
            // Skip the submit button
            if (is_string($val) && strtolower(trim($val)) === 'submit') continue;

            $all_fields[] = array(
                'key'   => $key,
                'label' => $label,
                'value' => $val
            );
        }

        // --- LOGGING THE DATA ---
        // This will show exactly what you are sending to the CRM
        $debug_log("--- NEW SUBMISSION (Form ID: $form_id) ---");
        $debug_log("Sending Data: " . print_r($all_fields, true));


        // --- DISPATCH TO CRM ---
        $payload = array(
            'raw_fields' => $all_fields
        );

        $response = wp_remote_post( $crm_url, array(
            'headers'  => array('Content-Type' => 'application/json', 'X-API-KEY' => $api_key),
            'body'     => json_encode( $payload ),
            'timeout'  => 25,
            'blocking' => true,
        ));

        // --- STATUS LOGGING ---
        if ( is_wp_error($response) ) {
            $debug_log("API Error: " . $response->get_error_message());
        } else {
            $code = wp_remote_retrieve_response_code($response);
            $debug_log("API Success: Received Status Code $code");
        }
        $debug_log("------------------------------------------");
    }
}
