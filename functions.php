<?php

function echo_cr()
{
    echo "<!-- Personal-Intro-Website PHP Template by agoudbg -->\n<!-- https://github.com/agoudbg/Personal-Intro-Website -->";
}

function curl_get($url)
{
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_URL, $url);
    curl_setopt($curl, CURLOPT_RETURNTRANSFER,  1);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, FALSE);
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, FALSE);

    $ret = curl_exec($curl);

    curl_close($curl);
    return $ret;
}

function getRandom($arr){
    // $arr = array(1,2,3,4);
    $rand = array_rand($arr, 4);
    return $arr[$rand[0]];
}