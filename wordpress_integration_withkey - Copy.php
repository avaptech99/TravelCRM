<?php
/**
 * Advanced Travel CRM - WordPress Ninja Forms Integration (v3.9)
 * Target: Booking Flights - Form ID 3
 * FIX: Indestructible Repeater Parsing! Extracts all extra typed values, regardless of nested/flat structure.
 */

add_action( 'ninja_forms_after_submission', 'travelwindow_crm_ninja_forms_submit_v3_9' );

if ( ! function_exists( 'travelwindow_crm_ninja_forms_submit_v3_9' ) ) {
    function travelwindow_crm_ninja_forms_submit_v3_9( $data ) {
        
        // --- 1. CONFIGURATION ---
        $crm_url = 'https://travelcrm-testing.onrender.com/api/external/lead'; 
        $api_key = 'crm-wp-integration-2026'; 

        $form_id = is_object($data) && method_exists($data, 'get_id') ? $data->get_id() : (isset($data['form_id']) ? $data['form_id'] : 0);
        if ( $form_id != 3 ) return;

        // Logging
        $log_file = trailingslashit(ABSPATH) . 'crm_debug.txt';
        $debug_log = function($msg) use ($log_file) {
            file_put_contents($log_file, "[" . date("Y-m-d H:i:s") . "] " . $msg . "\n", FILE_APPEND);
        };

        // --- 2. EXTRACT FIELDS ---
        $fields = isset($data['fields']) ? $data['fields'] : (is_array($data) ? $data : array());
        if (empty($fields)) return;

        $payload = array();
        
        // Data Accumulators
        $leg1_from = ""; $leg1_to = ""; $leg1_date = "";
        $adults = 0; $children = 0; $infants = 0; $class_pref = "Economy"; $trip_type = "One-Way";
        $email = ""; $phone = ""; $name = "";
        
        $additional_legs = array();
        $unmapped_flat = array();

        // --- 3. PROCESS FIELDS BULLETPROOFLY ---
        // We strictly match Leg 1 and Contact fields. EVERYTHING else typed by the user goes to unmapped flat.
        foreach ( $fields as $f ) {
            $key = is_object($f) && method_exists($f, 'get_setting') ? $f->get_setting('key') : (isset($f['key']) ? $f['key'] : (isset($f['id']) ? $f['id'] : ''));
            $label = is_object($f) && method_exists($f, 'get_setting') ? $f->get_setting('label') : (isset($f['label']) ? $f['label'] : $key);
            $val = is_object($f) && method_exists($f, 'get_value') ? $f->get_value() : (isset($f['value']) ? $f['value'] : '');
            
            // Skip purely empty fields
            if (empty($val) || (is_string($val) && strtolower(trim($val)) === 'submit')) continue;

            $l_low = strtolower(trim($label));
            
            // Skip buttons and internal IDs
            if (strpos($l_low, 'submit') !== false || preg_match('/id$/', $l_low) || $l_low === 'add city') {
                continue; 
            }

            // PRIMARY DATA EXTRACTION (Exact string matching to avoid false positives)
            $matched = true;
            if     ($l_low === 'from') { $leg1_from = is_array($val) ? '' : $val; }
            elseif ($l_low === 'to') { $leg1_to = is_array($val) ? '' : $val; }
            elseif ($l_low === 'departure' || strpos($l_low, 'travel date') !== false) { $leg1_date = is_array($val) ? '' : $val; }
            elseif (strpos($l_low, 'adult') !== false) { $adults = is_array($val) ? 0 : $val; }
            elseif (strpos($l_low, 'child') !== false) { $children = is_array($val) ? 0 : $val; }
            elseif (strpos($l_low, 'infant') !== false) { $infants = is_array($val) ? 0 : $val; }
            elseif (strpos($l_low, 'class') !== false) { $class_pref = is_array($val) ? '' : $val; }
            elseif (strpos($l_low, 'radio text') !== false || strpos($l_low, 'radio list') !== false || strpos($l_low, 'trip type') !== false || strpos($l_low, 'one way') !== false) { $trip_type = is_array($val) ? '' : $val; }
            elseif (strpos($l_low, 'email') !== false) { $email = is_array($val) ? '' : $val; }
            elseif (strpos($l_low, 'phone') !== false || strpos($l_low, 'mobile') !== false) { $phone = is_array($val) ? '' : $val; }
            elseif (strpos($l_low, 'name') !== false && strpos($l_low, 'user') === false) { $name = is_array($val) ? '' : $val; }
            else {
                $matched = false;
            }

            // IF FIELD IS NOT ONE OF THE ABOVE PRIMARY ONES
            if (!$matched) {
                // If it's a Nested Array (Repeater block)
                if (is_array($val)) {
                    foreach ($val as $row) {
                        if (is_array($row)) {
                            $row_vals = array();
                            array_walk_recursive($row, function($v, $k) use (&$row_vals) {
                                if (strpos(strtolower($k), 'id') === false && !preg_match('/^\d+\.\d+_\d+$/', $v)) {
                                    if (is_string($v) && trim($v) !== '') $row_vals[] = strip_tags(trim($v));
                                }
                            });
                            if (count($row_vals) >= 2) {
                                $additional_legs[] = array(
                                    'from' => $row_vals[0], 'to' => $row_vals[1], 'date' => isset($row_vals[2]) ? $row_vals[2] : ''
                                );
                            }
                        }
                    }
                } 
                // If it's a Flat value (e.g. flat repeater fields generated by an add-on)
                else {
                    $flat_val = strip_tags(trim((string)$val));
                    $v_low = strtolower($flat_val);
                    // Filter out UI junk before saving as extra data
                    if ($flat_val !== '' && $v_low !== 'add city' && $v_low !== 'submit') {
                        $unmapped_flat[] = $flat_val;
                    }
                }
            }
        }

        // --- 4. ASSEMBLE ADDITIONAL LEGS FROM RAW VALUES ---
        // If nested arrays didn't catch the legs, try chunking the sequentially typed flat values
        if (empty($additional_legs) && count($unmapped_flat) >= 2) {
            $chunks = array_chunk($unmapped_flat, 3);
            foreach ($chunks as $chunk) {
                if (count($chunk) >= 2) {
                    $additional_legs[] = array(
                        'from' => isset($chunk[0]) ? $chunk[0] : '',
                        'to'   => isset($chunk[1]) ? $chunk[1] : '',
                        'date' => isset($chunk[2]) ? $chunk[2] : ''
                    );
                }
            }
        }

        // --- 5. BUILD THE LOG ---
        $is_multi = (strpos(strtolower($trip_type), 'multi') !== false);
        $trip_type_clean = $is_multi ? 'Multi-City' : rtrim($trip_type);
        if (!$trip_type_clean) $trip_type_clean = 'Multi-City'; // Fallback

        $log = "Direct Booking Inquiry from Website\n\n";
        $log .= "Trip Type: $trip_type_clean\n\n";

        // Always print Leg-1
        $log .= "Leg-1 flight from: $leg1_from  -->  Flight to: $leg1_to\n";
        $log .= "Travel Date: $leg1_date\n\n";

        // Print Repeater Legs
        foreach ($additional_legs as $i => $leg) {
            $n = $i + 2;
            $f = isset($leg['from']) ? $leg['from'] : '';
            $t = isset($leg['to']) ? $leg['to'] : '';
            $d = isset($leg['date']) ? $leg['date'] : '';
            
            $log .= "Leg-$n Flight From: $f  -->  Flight to: $t\n";
            $log .= "Travel Date: $d\n\n";
        }

        // Print Leftovers (if they weren't matched as a leg)
        // Helps debug if chunks were missing
        if (empty($additional_legs) && !empty($unmapped_flat)) {
            $log .= "--- Extra Information ---\n";
            $log .= implode(", ", $unmapped_flat) . "\n\n";
        }

        $log .= "Class: $class_pref\n\n";
        $log .= "Passenger Breakdown: $adults Adults, $children Children, $infants Infants";

        // --- 6. POPULATE BACKEND CRM DATA ---
        $payload['detailedRequirements'] = $log;
        $payload['tripType']      = $trip_type;
        $payload['flightFrom']    = $leg1_from;
        $payload['flightTo']      = $leg1_to;
        $payload['travelDate']    = $leg1_date;
        $payload['contactEmail']  = $email;
        $payload['contactNumber'] = $phone;
        $payload['contactPerson'] = $name ?: 'Website Lead';
        $payload['adults']        = (int)$adults;
        $payload['children']      = (int)$children;
        $payload['infants']       = (int)$infants;
        $payload['class']         = $class_pref;

        // Feed CRM multi-city parser
        foreach ($additional_legs as $i => $leg) {
            $n = $i + 2;
            $payload["flightFrom_$n"] = isset($leg['from']) ? $leg['from'] : '';
            $payload["flightTo_$n"]   = isset($leg['to']) ? $leg['to'] : '';
            $payload["travelDate_$n"] = isset($leg['date']) ? $leg['date'] : '';
        }

        // --- 7. DISPATCH (ASYNCHRONOUS) ---
        $response = wp_remote_post( $crm_url, array(
            'headers'  => array('Content-Type' => 'application/json', 'X-API-KEY' => $api_key),
            'body'     => json_encode( $payload ),
            'timeout'  => 5,
            'blocking' => false,
        ));
        
        if ( is_wp_error($response) ) {
            $debug_log("Error Dispatching: " . $response->get_error_message());
        } else {
            $debug_log("Success: Dispatched asynchronously to CRM.");
        }
    }
}
