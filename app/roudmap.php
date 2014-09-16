<?php

$url = "https://tasks.verumnets.ru/issues.json";

$url .= "?" . http_build_query(array(
    "key" =>"553a52a60d91dd82cfc74f056f509b747c336c7c",
    "parent_id" => isset($_GET['id']) ? $_GET['id'] : 31078,
    "sort" => "start_date:desc"
));

$username = 'ilimer';
$password = 'kxL98NjI';

$context = stream_context_create(array(
    'http' => array(
        'header'  => "Authorization: Basic " . base64_encode("$username:$password") . "\r\n"
    )
));

$data = json_decode(file_get_contents($url, false, $context), true);

var_dump($data);


foreach ($data['issues'] as $task) {
    echo "<li>" . $task['subject'];
}



?>