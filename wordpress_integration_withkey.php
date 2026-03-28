<?php
/**
 * Advanced Travel CRM - WordPress Ninja Forms Integration (v3.5)
 * Target: Booking Flights - Form ID 3
 * FINAL POLISH: Clean, readable formatting for Detailed Requirements.
 */

add_action( 'ninja_forms_after_submission', 'travelwindow_crm_ninja_forms_submit_v3_5' );

if ( ! function_exists( 'travelwindow_crm_ninja_forms_submit_v3_5' ) ) {
    function travelwindow_crm_ninja_forms_submit_v3_5( $data ) {
        
        // --- 1. CONFIGURATION (PRESERVED) ---
        $crm_url = 'https://travelcrm-testing.onrender.com/api/external/lead'; 
        $api_key = 'crm-wp-integration-2026'; 
        
        // --- 2. FORM FILTERING ---
        $allowed_form_ids = array( 3 ); 
        $form_id = 0;
        if (is_object($data) && method_exists($data, 'get_id')) {
            $form_id = $data->get_id();
        } elseif (isset($data['form_id'])) {
            $form_id = $data['form_id'];
        }

        if ( !empty($allowed_form_ids) && !in_array($form_id, $allowed_form_ids) ) {
            return; 
        }

        // Setup Logging
        $log_file = trailingslashit(ABSPATH) . 'crm_debug.txt';
        $debug_log = function($msg) use ($log_file) {
            file_put_contents($log_file, "[" . date("Y-m-d H:i:s") . "] " . $msg . "\n", FILE_APPEND);
        };

        // --- 3. EXTRACT FIELDS ---
        $fields = array();
        if (isset($data['fields'])) {
            $fields = $data['fields'];
        } elseif (is_array($data)) {
            $fields = $data;
        }

        if (empty($fields)) return;

        $payload = array();
        $summary_parts = array();
        
        // --- 4. PROCESS FIELDS (CLEAN & ARRANGED) ---
        foreach ( $fields as $f_id => $f ) {
            if (is_object($f) && method_exists($f, 'get_setting')) {
                $key   = $f->get_setting('key');
                $label = $f->get_setting('label');
                $val   = $f->get_value();
            } else {
                $f_arr = (array)$f;
                $key   = isset($f_arr['key']) ? $f_arr['key'] : (isset($f_arr['id']) ? $f_arr['id'] : $f_id);
                $label = isset($f_arr['label']) ? $f_arr['label'] : $key;
                $val   = isset($f_arr['value']) ? $f_arr['value'] : '';
            }

            if (empty($val)) continue;

            // Handle Repeater Data - FLATTEN & CLEAN
            if (is_array($val)) {
                foreach ($val as $row_idx => $row) {
                    $leg_num = $row_idx + 1;
                    if (is_array($row)) {
                        $leg_from = ""; $leg_to = ""; $leg_date = "";
                        foreach ($row as $sub_key => $sub_val) {
                            if (empty($sub_val) || strpos($sub_key, 'id') !== false) continue;
                            
                            // Guess field type by ID pattern or value
                            $s_low = strtolower($sub_key);
                            if (strpos($s_low, '37.1') !== false) $leg_from = $sub_val;
                            elseif (strpos($s_low, '37.2') !== false) $leg_to = $sub_val;
                            elseif (strpos($s_low, '37.3') !== false) $leg_date = $sub_val;
                            
                            // Also store for logic
                            $payload["{$key}_{$leg_num}_{$sub_key}"] = $sub_val;
                        }
                        
                        // Add beautiful leg summary
                        if ($leg_from || $leg_to) {
                            $summary_parts[] = "Leg $leg_num: $leg_from -> $leg_to" . ($leg_date ? " ($leg_date)" : "");
                        }
                    }
                }
                continue;
            }

            // Standard Single Fields
            $payload[$key] = $val;
            
            // Filter out junk metadata from summary
            if (strpos(strtolower($key), 'submit') === false && strpos(strtolower($key), 'id') === false) {
                $summary_parts[] = strip_tags($label) . ": $val";
            }
        }

        // Build Highly Readable Log
        $payload['detailedRequirements'] = "Direct Booking Inquiry from Website\n\n" . implode("\n", $summary_parts);

        // --- 5. SMART FIELD MAPPING (FOR BACKEND LOGIC) ---
        foreach ($payload as $k => $v) {
            $k_low = strtolower($k);
            if (!isset($payload['contactPerson']) && (strpos($k_low, 'name') !== false)) $payload['contactPerson'] = $v;
            if (!isset($payload['contactNumber']) && (strpos($k_low, 'phone') !== false || strpos($k_low, 'mobile') !== false)) $payload['contactNumber'] = $v;
            if (!isset($payload['contactEmail']) && strpos($k_low, 'email') !== false) $payload['contactEmail'] = $v;
            if (!isset($payload['tripType']) && strpos($k_low, 'trip') !== false) $payload['tripType'] = $v;
            
            if (!isset($payload['flightFrom']) && (strpos($k_low, 'from') === 0 || strpos($k_low, 'flightfrom') === 0)) $payload['flightFrom'] = $v;
            if (!isset($payload['flightTo']) && (strpos($k_low, 'to') === 0 || strpos($k_low, 'flightto') === 0)) $payload['flightTo'] = $v;
            if (!isset($payload['travelDate']) && (strpos($k_low, 'dep') === 0 || strpos($k_low, 'travel') === 0)) $payload['travelDate'] = $v;
        }

        // --- 6. DISPATCH ---
        $response = wp_remote_post( $crm_url, array(
            'headers' => array('Content-Type' => 'application/json', 'X-API-KEY' => $api_key),
            'body'    => json_encode( $payload ),
            'timeout' => 15,
        ) );
        
        if ( is_wp_error( $response ) ) {
            $debug_log("Error: " . $response->get_error_message());
        } else {
            $debug_log("Success: Code " . wp_remote_retrieve_response_code($response));
        }
    }
}
