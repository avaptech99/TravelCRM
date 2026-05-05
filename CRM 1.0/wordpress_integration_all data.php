<?php
/**
 * Travel CRM - WordPress Ninja Forms Integration (v4.0 FINAL)
 * Form ID 3 only. Super simple: forward ALL raw fields to backend. Backend handles formatting.
 */

add_action( 'ninja_forms_after_submission', 'travelwindow_crm_send_all_v4' );

if ( ! function_exists( 'travelwindow_crm_send_all_v4' ) ) {
    function travelwindow_crm_send_all_v4( $data ) {

        $crm_url = 'https://travelcrm-testing.onrender.com/api/external/lead';
        $api_key = 'crm-wp-integration-2026';

        // Only form 3
        $form_id = is_object($data) && method_exists($data, 'get_id') ? $data->get_id() : (isset($data['form_id']) ? $data['form_id'] : 0);
        if ( $form_id != 3 ) return;

        $log_file = trailingslashit(ABSPATH) . 'crm_debug.txt';
        $debug_log = function($msg) use ($log_file) {
            file_put_contents($log_file, "[" . date("Y-m-d H:i:s") . "] " . $msg . "\n", FILE_APPEND);
        };

        $fields = isset($data['fields']) ? $data['fields'] : (is_array($data) ? $data : array());
        if (empty($fields)) return;

        // --- JUST DUMP EVERYTHING ---
        // We send every field with its label and value. The backend will sort it out.
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
            if (is_string($val) && strtolower(trim($val)) === 'submit') continue;

            $all_fields[] = array(
                'key'   => $key,
                'label' => $label,
                'value' => $val
            );
        }

        $debug_log("Sending " . count($all_fields) . " fields to CRM.");


        $payload = array(
            'raw_fields' => $all_fields
        );

        $response = wp_remote_post( $crm_url, array(
            'headers'  => array('Content-Type' => 'application/json', 'X-API-KEY' => $api_key),
            'body'     => json_encode( $payload ),
            'timeout'  => 25,
            'blocking' => true,
        ));

        if ( is_wp_error($response) ) {
            $debug_log("Error: " . $response->get_error_message());
        } else {
            $debug_log("Success: Code " . wp_remote_retrieve_response_code($response));
        }
    }
}