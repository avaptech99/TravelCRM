/**
 * CRM Integration for Ninja Forms (Booking Flights - Form ID 3)
 * This connects your live WordPress site to your live travelcrm-testing.onrender.com backend
 */

add_action( 'ninja_forms_after_submission', 'travelwindow_crm_ninja_forms_submit_v2' );

if ( ! function_exists( 'travelwindow_crm_ninja_forms_submit_v2' ) ) {
    function travelwindow_crm_ninja_forms_submit_v2( $form_data ) {
        // 1. Ensure this is only running for Form ID 3
        $form_id = isset( $form_data['form_id'] ) ? $form_data['form_id'] : 0;
        if ( $form_id != 3 ) {
            return;
        }

        // 2. Setup Logging to troubleshoot if necessary
        $log_file = trailingslashit(ABSPATH) . 'crm_debug.txt';
        file_put_contents($log_file, "[" . date("Y-m-d H:i:s") . "] Processing Form 3" . "\n", FILE_APPEND);

        // 3. API Configuration
        $crm_url = 'https://travelcrm-testing.onrender.com/api/external/lead'; // YOUR LIVE RENDER URL
        $api_key = 'crm-wp-integration-2026';

        // 4. Map Fields (Using safer Ninja Forms v3 array structure)
        $fields_by_key = array();
        $unmapped_data = "\n\n--- Additional Customer Information ---\n";
        
        // Define the exact keys of the fields we already map manually, so we don't duplicate them in the notes
        $mapped_keys = array(
            'phone_1710741985398',
            'email_1710741948527',
            'from_1710741487545',
            'to_1710741556864',
            'departure_1710741636353',
            'return_1710741682217',
            'listradio_1710745253292',
            'adults_12y_1712752891789',
            'children_2y_-_12y_1712752915056',
            'infants_below_2y_1712752927823',
            'travellers_and_amp_class_1712754155672'
        );

        if ( isset( $form_data['fields'] ) && is_array( $form_data['fields'] ) ) {
            foreach( $form_data['fields'] as $field ) {
                if ( isset( $field['key'] ) && isset( $field['value'] ) ) {
                    $fields_by_key[ $field['key'] ] = $field['value'];
                    
                    // If it is NOT one of our manually mapped keys, and it's NOT empty, and NOT a submit button...
                    // We automatically capture it as "Extra Information"
                    if ( !in_array($field['key'], $mapped_keys) && !empty($field['value']) && strpos(strtolower($field['key']), 'submit') === false ) {
                        // Use the field's label if it exists, otherwise just fall back to the raw key
                        $label = isset($field['label']) ? $field['label'] : $field['key'];
                        $raw_value = $field['value'];
                        
                        // Recursive flatten function for deeply nested arrays
                        $flattened_value = '';
                        if (is_array($raw_value)) {
                            $flat_array = array();
                            array_walk_recursive($raw_value, function($a) use (&$flat_array) { $flat_array[] = $a; });
                            $flattened_value = implode(', ', $flat_array);
                        } else {
                            $flattened_value = $raw_value;
                        }
                        
                        // Only add if there is actual content
                        if (!empty(trim($flattened_value))) {
                            $unmapped_data .= "- " . strip_tags($label) . ": " . strip_tags($flattened_value) . "\n";
                        }
                    }
                }
            }
        }

        // If no extra data was captured, remove the header so it stays clean
        if (trim($unmapped_data) === "--- Additional Customer Information ---") {
            $unmapped_data = "";
        }

        $payload = array(
            'contactPerson' => 'Website Lead', // Fallback name
            'contactNumber' => isset($fields_by_key['phone_1710741985398']) ? $fields_by_key['phone_1710741985398'] : '',
            'contactEmail'  => isset($fields_by_key['email_1710741948527']) ? $fields_by_key['email_1710741948527'] : '',
            'flightFrom'    => isset($fields_by_key['from_1710741487545']) ? $fields_by_key['from_1710741487545'] : '',
            'flightTo'      => isset($fields_by_key['to_1710741556864']) ? $fields_by_key['to_1710741556864'] : '',
            'travelDate'    => isset($fields_by_key['departure_1710741636353']) ? ltrim($fields_by_key['departure_1710741636353']) : '',
            'returnDate'    => isset($fields_by_key['return_1710741682217']) ? $fields_by_key['return_1710741682217'] : '',
            'tripType'      => isset($fields_by_key['listradio_1710745253292']) ? $fields_by_key['listradio_1710745253292'] : 'one-way',
            'adults'        => isset($fields_by_key['adults_12y_1712752891789']) ? (int)$fields_by_key['adults_12y_1712752891789'] : 0,
            'children'      => isset($fields_by_key['children_2y_-_12y_1712752915056']) ? (int)$fields_by_key['children_2y_-_12y_1712752915056'] : 0,
            'infants'       => isset($fields_by_key['infants_below_2y_1712752927823']) ? (int)$fields_by_key['infants_below_2y_1712752927823'] : 0,
            'class'         => isset($fields_by_key['travellers_and_amp_class_1712754155672']) ? $fields_by_key['travellers_and_amp_class_1712754155672'] : 'Economy',
            'requirements'  => "Direct Booking Inquiry from Website" . $unmapped_data 
        );

        // Extract name from email if email is provided
        if ( ! empty($payload['contactEmail']) && strpos($payload['contactEmail'], '@') !== false ) {
            $email_parts = explode('@', $payload['contactEmail']);
            $payload['contactPerson'] = ucwords( str_replace( array('.', '_', '-'), ' ', $email_parts[0] ) );
        }

        // 5. Send POST request securely
        $response = wp_remote_post( $crm_url, array(
            'method'    => 'POST',
            'headers'   => array(
                'Content-Type' => 'application/json',
                'X-API-KEY'    => $api_key,
            ),
            'body'      => json_encode( $payload ),
            'timeout'   => 15,
        ) );

        // 6. Log success/failure
        if ( is_wp_error( $response ) ) {
            file_put_contents($log_file, "Error: " . $response->get_error_message() . "\n", FILE_APPEND);
        } else {
            file_put_contents($log_file, "Success: CRM responded with HTTP " . wp_remote_retrieve_response_code( $response ) . "\n", FILE_APPEND);
        }
    }
}
