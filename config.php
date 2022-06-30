<?php

// 
$site_url = "https://agou.im";

// 站点head信息设置

$site_title = "Welcome to agou.im";
$site_intro = "Welcome to agou's website.";
$site_keyword = "agou";
$site_favicon = "https://gravatar.junbo.wang/avatar/92f14fcd71bdc4008eb6d7f2e6ca50e8?s=128&r=R&d=";

// 站点界面设置
$site_header_name = "agou";
$site_header_light_color = "#000";
$site_header_dark_color = "#fff";
$site_header_icon = "https://gravatar.junbo.wang/avatar/92f14fcd71bdc4008eb6d7f2e6ca50e8?s=128&r=R&d=";
$site_background_light = "$site_url/src/img/background_light.png";
$site_background_dark = "$site_url/src/img/background_dark.png";

$site_footer = '<a href="https://icp.gov.moe/?keyword=20225229" target="_blank">萌ICP备20225229号</a>';

// 站点网站项目展示信息设置
$websites_list = array(
    array(
        "name" => "agou's Blog",
        "host" => "blog.agou.im",
        "url" => "https://blog.agou.im?ref=agou.im",
        "icon" => "./src/img/sitelogos/blog.png",
        "description" => "agou 的个人博客",
        "show_in_slug" => 1
    ),
    array(
        "name" => "安播空间",
        "host" => "anbo.space",
        "url" => "https://anbo.space?ref=agou.im",
        "icon" => "./src/img/sitelogos/anbo.png",
        "description" => "电视爱好者聚集地。",
        "show_in_slug" => 1
    ),
    array(
        "name" => "nmTeam",
        "host" => "nmteam.xyz",
        "url" => "https://nmteam.xyz?ref=agou.im",
        "icon" => "./src/img/sitelogos/nmteam.png",
        "description" => "我再说一遍，nm 是柠檬，绝对没有别的意思！",
        "show_in_slug" => 1
    ),
);

$blog_api = "https://blog.agou.im/api/posts?showContent=false&pageSize=7&page=1";

$about_text = "Hi，我是 agou，一个人群中最不起眼，但闹起事来让人急眼的普通大学生。<br>
平时就想写写代码水水群，但是真的不想学高数！<br>
欢迎来订阅我的 Telegram 频道 <a href=\"https://t.me/bakadog\" target=_blank>@bakadog</a>，听我说骚话。";

$about_contacts = array(
    array(
        "id" => "GitHub",
        "link" => "https://github.com/agoudbg",
        "text" => "GitHub @agoudbg"
    ),
    array(
        "id" => "Telegram",
        "link" => "https://t.me/agoudbg",
        "text" => "Telegram @agoudbg"
    ),
    array(
        "id" => "Twitter",
        "link" => "https://twitter.com/agoudbg",
        "text" => "Twitter @agoudbg"
    ),
);

$friends_link = array(
    array(
        "name" => "Air's&nbsp;home",
        "host" => "zhiccc.net",
        "url" => "https://zhiccc.net",
        "icon" => "https://zhiccc.net/logo.ico",
        "description" => "一个奇奇怪怪，啥都有的网站"
    ),
    array(
        "name" => "CodyBlog",
        "host" => "yizhao.xyz",
        "url" => "https://www.yizhao.xyz/",
        "icon" => "https://gravatar.zeruns.tech/avatar/6688ab04030524f7b5a70b21859a034c",
        "description" => "CodyNotFound&nbsp;der&nbsp;Blog"
    ),
    array(
        "name" => "Hat's Blog",
        "host" => "hatblog.me",
        "url" => "https://hatblog.me",
        "icon" => "https://hatblog.me/icons/icon-96x96.png",
        "description" => "Just be happy"
    ),
    array(
        "name" => "Revincx",
        "host" => "revincx.icu",
        "url" => "https://blog.revincx.icu",
        "icon" => "https://cdn.jsdelivr.net/gh/Revincx/blog-assets@master/images/avatar.jpg",
        "description" => "可爱就是正义~"
    ),
    array(
        "name" => "XYZ1024'&nbsp;Blog",
        "host" => "xyz1024.top",
        "url" => "https://xyz1024.top",
        "icon" => "https://img.cncn3.cn/images/3pWV.png",
        "description" => "什么废就写什么"
    ),
    array(
        "name" => "东方众的不知名小站",
        "host" => "cosix.xyz",
        "url" => "https://cosix.xyz",
        "icon" => "https://cdn.cncn3.cn/webstatic/6663759e45c3c/1c89997582e25e16a1f47971996ac0c9.jpg",
        "description" => "呐呐呐，你也喜欢二次元？"
    ),
    array(
        "name" => "1212967",
        "host" => "1212967.xyz",
        "url" => "https://1212967.xyz",
        "icon" => "https://cdn.cncn3.cn/webstatic/fbddec54351f1/f5b8d4c340729ae67ac7a5324120182c.jpg",
        "description" => "一个屑个人博客"
    ),
    array(
        "name" => "gelith的个人主页",
        "host" => "www.gelith.top",
        "url" => "https://www.gelith.top",
        "icon" => "https://cdn.cncn3.cn/webstatic/dec11a17ca998/logo.jpg",
        "description" => "一个热爱计算机的青年"
    )
);
