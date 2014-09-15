<?php

$url = "https://tasks.verumnets.ru/issues.json";

$url .= "?" . http_build_query(array(
    "project_id" => 29,
    "key" =>"553a52a60d91dd82cfc74f056f509b747c336c7c"
));


echo $url;

$username = 'ilimer';
$password = 'kxL98NjI';

$context = stream_context_create(array(
    'http' => array(
        'header'  => "Authorization: Basic " . base64_encode("$username:$password") . "\r\n"
    )
));


$data = file_get_contents($url,false, $context);

var_dump($data);


//echo json_decode(file_get_contents($url));


?>