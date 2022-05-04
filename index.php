<?php
require("./functions.php");
require("./config.php");

echo_cr();

?>
<!DOCTYPE html>
<html lang="zh">

<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $site_title; ?></title>
    <meta name="keywords" content="<?php echo $site_keyword; ?>">
    <meta name="description" content="<?php echo $site_intro; ?>">
    <link rel="stylesheet" href="./src/css/page.css">
    <style>
        body {
            --header-color: <?php echo $site_header_light_color; ?>
        }

        body[theme=dark] {
            --header-color: <?php echo $site_header_dark_color; ?>
        }
    </style>
</head>

<body>
    <div class="pageBackground" style="--lightbg: url(<?php echo $site_background_light; ?>); --darkbg: url(<?php echo $site_background_dark; ?>)"></div>
    <div class="pageHeader" id="pageHeader">
        <div class="info" id="pageHeaderInfo">
            <i style="background-image: url(<?php echo $site_header_icon; ?>);"></i>
            <p><?php echo $site_header_name; ?></p>
        </div>
    </div>
    <div class="pageDetails" id="pageDetails"></div>
    <div class="pageMain" id="pageMain">
        <div class="cards">
            <button class="card" data-cardmode="preview" data-cardid="site" onclick="openCard(this)">
                <object>
                    <div class="previewArea">
                        <div class="cardHeader">
                            <div class="cardName">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M698.026667 597.333333c3.413333-28.16 5.973333-56.32 5.973333-85.333333 0-29.013333-2.56-57.173333-5.973333-85.333333h144.213333c6.826667 27.306667 11.093333 55.893333 11.093333 85.333333s-4.266667 58.026667-11.093333 85.333333m-219.733333 237.226667c25.6-47.36 45.226667-98.56 58.88-151.893333h125.866666a342.613333 342.613333 0 0 1-184.746666 151.893333M611.84 597.333333H412.16c-4.266667-28.16-6.826667-56.32-6.826667-85.333333 0-29.013333 2.56-57.6 6.826667-85.333333h199.68c3.84 27.733333 6.826667 56.32 6.826667 85.333333 0 29.013333-2.986667 57.173333-6.826667 85.333333M512 851.626667c-35.413333-51.2-64-107.946667-81.493333-168.96h162.986666c-17.493333 61.013333-46.08 117.76-81.493333 168.96M341.333333 341.333333H216.746667A338.048 338.048 0 0 1 401.066667 189.44C375.466667 236.8 356.266667 288 341.333333 341.333333m-124.586666 341.333334H341.333333c14.933333 53.333333 34.133333 104.533333 59.733334 151.893333A341.674667 341.674667 0 0 1 216.746667 682.666667m-34.986667-85.333334C174.933333 570.026667 170.666667 541.44 170.666667 512s4.266667-58.026667 11.093333-85.333333h144.213333c-3.413333 28.16-5.973333 56.32-5.973333 85.333333 0 29.013333 2.56 57.173333 5.973333 85.333333M512 171.946667c35.413333 51.2 64 108.373333 81.493333 169.386666h-162.986666c17.493333-61.013333 46.08-118.186667 81.493333-169.386666M807.253333 341.333333h-125.866666a667.733333 667.733333 0 0 0-58.88-151.893333c78.506667 26.88 143.786667 81.066667 184.746666 151.893333M512 85.333333C276.053333 85.333333 85.333333 277.333333 85.333333 512a426.666667 426.666667 0 0 0 426.666667 426.666667 426.666667 426.666667 0 0 0 426.666667-426.666667A426.666667 426.666667 0 0 0 512 85.333333z" fill="" p-id="2154"></path>
                                </svg>
                                <span>网站</span>
                            </div>
                        </div>
                        <div class="main">
                            <div class="siteSlug">
                                <?php
                                foreach ($websites_list as $i => $site_info) {
                                    if ($site_info['show_in_slug'] == 1) {
                                ?>
                                        <div class="site">
                                            <i style="background-image: url('<?php echo $site_info['icon']; ?>');"></i>
                                            <div class="text">
                                                <div class="name"><?php echo $site_info['name']; ?></div>
                                                <div class="description"><?php echo $site_info['description']; ?></div>
                                            </div>
                                        </div>
                                <?php
                                    }
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="detailArea">
                        <div class="cardHeader">
                            <button class="close" placeholder="关闭" onclick="closeCard('site')">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M544.448 499.2l284.576-284.576a32 32 0 0 0-45.248-45.248L499.2 453.952 214.624 169.376a32 32 0 0 0-45.248 45.248l284.576 284.576-284.576 284.576a32 32 0 0 0 45.248 45.248l284.576-284.576 284.576 284.576a31.904 31.904 0 0 0 45.248 0 32 32 0 0 0 0-45.248L544.448 499.2z"></path>
                                </svg>
                            </button>
                            <div class="cardName">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M698.026667 597.333333c3.413333-28.16 5.973333-56.32 5.973333-85.333333 0-29.013333-2.56-57.173333-5.973333-85.333333h144.213333c6.826667 27.306667 11.093333 55.893333 11.093333 85.333333s-4.266667 58.026667-11.093333 85.333333m-219.733333 237.226667c25.6-47.36 45.226667-98.56 58.88-151.893333h125.866666a342.613333 342.613333 0 0 1-184.746666 151.893333M611.84 597.333333H412.16c-4.266667-28.16-6.826667-56.32-6.826667-85.333333 0-29.013333 2.56-57.6 6.826667-85.333333h199.68c3.84 27.733333 6.826667 56.32 6.826667 85.333333 0 29.013333-2.986667 57.173333-6.826667 85.333333M512 851.626667c-35.413333-51.2-64-107.946667-81.493333-168.96h162.986666c-17.493333 61.013333-46.08 117.76-81.493333 168.96M341.333333 341.333333H216.746667A338.048 338.048 0 0 1 401.066667 189.44C375.466667 236.8 356.266667 288 341.333333 341.333333m-124.586666 341.333334H341.333333c14.933333 53.333333 34.133333 104.533333 59.733334 151.893333A341.674667 341.674667 0 0 1 216.746667 682.666667m-34.986667-85.333334C174.933333 570.026667 170.666667 541.44 170.666667 512s4.266667-58.026667 11.093333-85.333333h144.213333c-3.413333 28.16-5.973333 56.32-5.973333 85.333333 0 29.013333 2.56 57.173333 5.973333 85.333333M512 171.946667c35.413333 51.2 64 108.373333 81.493333 169.386666h-162.986666c17.493333-61.013333 46.08-118.186667 81.493333-169.386666M807.253333 341.333333h-125.866666a667.733333 667.733333 0 0 0-58.88-151.893333c78.506667 26.88 143.786667 81.066667 184.746666 151.893333M512 85.333333C276.053333 85.333333 85.333333 277.333333 85.333333 512a426.666667 426.666667 0 0 0 426.666667 426.666667 426.666667 426.666667 0 0 0 426.666667-426.666667A426.666667 426.666667 0 0 0 512 85.333333z" fill="" p-id="2154"></path>
                                </svg>
                                <span>网站</span>
                            </div>
                        </div>
                        <div class="main">
                            <div class="siteDetail">
                                <?php
                                foreach ($websites_list as $i => $site_info) {
                                ?>
                                    <a class="site" href="<?php echo $site_info['url']; ?>" target="_blank">
                                        <i style="background-image: url('<?php echo $site_info['icon']; ?>');"></i>
                                        <div class="text">
                                            <div class="name"><?php echo $site_info['name']; ?></div>
                                            <div class="url"><?php echo $site_info['host']; ?></div>
                                            <div class="description"><?php echo $site_info['description']; ?></div>
                                        </div>
                                    </a>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                </object>
            </button>
            <button class="card" data-cardmode="preview" data-cardid="blog" onclick="openCard(this)">
                <object>
                    <div class="previewArea">
                        <div class="cardHeader">
                            <div class="cardName">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M698.026667 597.333333c3.413333-28.16 5.973333-56.32 5.973333-85.333333 0-29.013333-2.56-57.173333-5.973333-85.333333h144.213333c6.826667 27.306667 11.093333 55.893333 11.093333 85.333333s-4.266667 58.026667-11.093333 85.333333m-219.733333 237.226667c25.6-47.36 45.226667-98.56 58.88-151.893333h125.866666a342.613333 342.613333 0 0 1-184.746666 151.893333M611.84 597.333333H412.16c-4.266667-28.16-6.826667-56.32-6.826667-85.333333 0-29.013333 2.56-57.6 6.826667-85.333333h199.68c3.84 27.733333 6.826667 56.32 6.826667 85.333333 0 29.013333-2.986667 57.173333-6.826667 85.333333M512 851.626667c-35.413333-51.2-64-107.946667-81.493333-168.96h162.986666c-17.493333 61.013333-46.08 117.76-81.493333 168.96M341.333333 341.333333H216.746667A338.048 338.048 0 0 1 401.066667 189.44C375.466667 236.8 356.266667 288 341.333333 341.333333m-124.586666 341.333334H341.333333c14.933333 53.333333 34.133333 104.533333 59.733334 151.893333A341.674667 341.674667 0 0 1 216.746667 682.666667m-34.986667-85.333334C174.933333 570.026667 170.666667 541.44 170.666667 512s4.266667-58.026667 11.093333-85.333333h144.213333c-3.413333 28.16-5.973333 56.32-5.973333 85.333333 0 29.013333 2.56 57.173333 5.973333 85.333333M512 171.946667c35.413333 51.2 64 108.373333 81.493333 169.386666h-162.986666c17.493333-61.013333 46.08-118.186667 81.493333-169.386666M807.253333 341.333333h-125.866666a667.733333 667.733333 0 0 0-58.88-151.893333c78.506667 26.88 143.786667 81.066667 184.746666 151.893333M512 85.333333C276.053333 85.333333 85.333333 277.333333 85.333333 512a426.666667 426.666667 0 0 0 426.666667 426.666667 426.666667 426.666667 0 0 0 426.666667-426.666667A426.666667 426.666667 0 0 0 512 85.333333z" fill="" p-id="2154"></path>
                                </svg>
                                <span>博客</span>
                            </div>
                        </div>
                        <div class="main">
                            <div class="blogSlug">
                                <?php
                                $blog_result = json_decode(curl_get($blog_api));
                                foreach ($blog_result->data as $i => $blog_article) {
                                    if($i>1) break;
                                ?>
                                    <div class="blog">
                                        <div class="title"><?php echo $blog_article->title; ?></div>
                                        <div class="slug"><?php echo $blog_article->text; ?></div>
                                    </div>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="detailArea">
                        <div class="cardHeader">
                            <button class="close" placeholder="关闭" onclick="closeCard('blog')">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M544.448 499.2l284.576-284.576a32 32 0 0 0-45.248-45.248L499.2 453.952 214.624 169.376a32 32 0 0 0-45.248 45.248l284.576 284.576-284.576 284.576a32 32 0 0 0 45.248 45.248l284.576-284.576 284.576 284.576a31.904 31.904 0 0 0 45.248 0 32 32 0 0 0 0-45.248L544.448 499.2z"></path>
                                </svg>
                            </button>
                            <div class="cardName">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M698.026667 597.333333c3.413333-28.16 5.973333-56.32 5.973333-85.333333 0-29.013333-2.56-57.173333-5.973333-85.333333h144.213333c6.826667 27.306667 11.093333 55.893333 11.093333 85.333333s-4.266667 58.026667-11.093333 85.333333m-219.733333 237.226667c25.6-47.36 45.226667-98.56 58.88-151.893333h125.866666a342.613333 342.613333 0 0 1-184.746666 151.893333M611.84 597.333333H412.16c-4.266667-28.16-6.826667-56.32-6.826667-85.333333 0-29.013333 2.56-57.6 6.826667-85.333333h199.68c3.84 27.733333 6.826667 56.32 6.826667 85.333333 0 29.013333-2.986667 57.173333-6.826667 85.333333M512 851.626667c-35.413333-51.2-64-107.946667-81.493333-168.96h162.986666c-17.493333 61.013333-46.08 117.76-81.493333 168.96M341.333333 341.333333H216.746667A338.048 338.048 0 0 1 401.066667 189.44C375.466667 236.8 356.266667 288 341.333333 341.333333m-124.586666 341.333334H341.333333c14.933333 53.333333 34.133333 104.533333 59.733334 151.893333A341.674667 341.674667 0 0 1 216.746667 682.666667m-34.986667-85.333334C174.933333 570.026667 170.666667 541.44 170.666667 512s4.266667-58.026667 11.093333-85.333333h144.213333c-3.413333 28.16-5.973333 56.32-5.973333 85.333333 0 29.013333 2.56 57.173333 5.973333 85.333333M512 171.946667c35.413333 51.2 64 108.373333 81.493333 169.386666h-162.986666c17.493333-61.013333 46.08-118.186667 81.493333-169.386666M807.253333 341.333333h-125.866666a667.733333 667.733333 0 0 0-58.88-151.893333c78.506667 26.88 143.786667 81.066667 184.746666 151.893333M512 85.333333C276.053333 85.333333 85.333333 277.333333 85.333333 512a426.666667 426.666667 0 0 0 426.666667 426.666667 426.666667 426.666667 0 0 0 426.666667-426.666667A426.666667 426.666667 0 0 0 512 85.333333z" fill="" p-id="2154"></path>
                                </svg>
                                <span>博客</span>
                            </div>
                        </div>
                        <div class="main">
                            <div class="blogDetail">
                                <?php
                                foreach ($blog_result->data as $i => $blog_article) {
                                ?>
                                    <a class="blog" href="<?php echo $blog_article->permalink; ?>" target="_blank">
                                        <div class="title"><?php echo $blog_article->title; ?></div>
                                        <div class="slug"><?php echo $blog_article->text; ?></div>
                                    </a>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                </object>
            </button>
            <button class="card" data-cardmode="preview" data-cardid="about" onclick="openCard(this)">
                <object>
                    <div class="previewArea">
                        <div class="cardHeader">
                            <div class="cardName">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M698.026667 597.333333c3.413333-28.16 5.973333-56.32 5.973333-85.333333 0-29.013333-2.56-57.173333-5.973333-85.333333h144.213333c6.826667 27.306667 11.093333 55.893333 11.093333 85.333333s-4.266667 58.026667-11.093333 85.333333m-219.733333 237.226667c25.6-47.36 45.226667-98.56 58.88-151.893333h125.866666a342.613333 342.613333 0 0 1-184.746666 151.893333M611.84 597.333333H412.16c-4.266667-28.16-6.826667-56.32-6.826667-85.333333 0-29.013333 2.56-57.6 6.826667-85.333333h199.68c3.84 27.733333 6.826667 56.32 6.826667 85.333333 0 29.013333-2.986667 57.173333-6.826667 85.333333M512 851.626667c-35.413333-51.2-64-107.946667-81.493333-168.96h162.986666c-17.493333 61.013333-46.08 117.76-81.493333 168.96M341.333333 341.333333H216.746667A338.048 338.048 0 0 1 401.066667 189.44C375.466667 236.8 356.266667 288 341.333333 341.333333m-124.586666 341.333334H341.333333c14.933333 53.333333 34.133333 104.533333 59.733334 151.893333A341.674667 341.674667 0 0 1 216.746667 682.666667m-34.986667-85.333334C174.933333 570.026667 170.666667 541.44 170.666667 512s4.266667-58.026667 11.093333-85.333333h144.213333c-3.413333 28.16-5.973333 56.32-5.973333 85.333333 0 29.013333 2.56 57.173333 5.973333 85.333333M512 171.946667c35.413333 51.2 64 108.373333 81.493333 169.386666h-162.986666c17.493333-61.013333 46.08-118.186667 81.493333-169.386666M807.253333 341.333333h-125.866666a667.733333 667.733333 0 0 0-58.88-151.893333c78.506667 26.88 143.786667 81.066667 184.746666 151.893333M512 85.333333C276.053333 85.333333 85.333333 277.333333 85.333333 512a426.666667 426.666667 0 0 0 426.666667 426.666667 426.666667 426.666667 0 0 0 426.666667-426.666667A426.666667 426.666667 0 0 0 512 85.333333z" fill="" p-id="2154"></path>
                                </svg>
                                <span>关于</span>
                            </div>
                        </div>
                        <div class="main">
                         
                        </div>
                    </div>
                    <div class="detailArea">
                        <div class="cardHeader">
                            <button class="close" placeholder="关闭" onclick="closeCard('about')">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M544.448 499.2l284.576-284.576a32 32 0 0 0-45.248-45.248L499.2 453.952 214.624 169.376a32 32 0 0 0-45.248 45.248l284.576 284.576-284.576 284.576a32 32 0 0 0 45.248 45.248l284.576-284.576 284.576 284.576a31.904 31.904 0 0 0 45.248 0 32 32 0 0 0 0-45.248L544.448 499.2z"></path>
                                </svg>
                            </button>
                            <div class="cardName">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M698.026667 597.333333c3.413333-28.16 5.973333-56.32 5.973333-85.333333 0-29.013333-2.56-57.173333-5.973333-85.333333h144.213333c6.826667 27.306667 11.093333 55.893333 11.093333 85.333333s-4.266667 58.026667-11.093333 85.333333m-219.733333 237.226667c25.6-47.36 45.226667-98.56 58.88-151.893333h125.866666a342.613333 342.613333 0 0 1-184.746666 151.893333M611.84 597.333333H412.16c-4.266667-28.16-6.826667-56.32-6.826667-85.333333 0-29.013333 2.56-57.6 6.826667-85.333333h199.68c3.84 27.733333 6.826667 56.32 6.826667 85.333333 0 29.013333-2.986667 57.173333-6.826667 85.333333M512 851.626667c-35.413333-51.2-64-107.946667-81.493333-168.96h162.986666c-17.493333 61.013333-46.08 117.76-81.493333 168.96M341.333333 341.333333H216.746667A338.048 338.048 0 0 1 401.066667 189.44C375.466667 236.8 356.266667 288 341.333333 341.333333m-124.586666 341.333334H341.333333c14.933333 53.333333 34.133333 104.533333 59.733334 151.893333A341.674667 341.674667 0 0 1 216.746667 682.666667m-34.986667-85.333334C174.933333 570.026667 170.666667 541.44 170.666667 512s4.266667-58.026667 11.093333-85.333333h144.213333c-3.413333 28.16-5.973333 56.32-5.973333 85.333333 0 29.013333 2.56 57.173333 5.973333 85.333333M512 171.946667c35.413333 51.2 64 108.373333 81.493333 169.386666h-162.986666c17.493333-61.013333 46.08-118.186667 81.493333-169.386666M807.253333 341.333333h-125.866666a667.733333 667.733333 0 0 0-58.88-151.893333c78.506667 26.88 143.786667 81.066667 184.746666 151.893333M512 85.333333C276.053333 85.333333 85.333333 277.333333 85.333333 512a426.666667 426.666667 0 0 0 426.666667 426.666667 426.666667 426.666667 0 0 0 426.666667-426.666667A426.666667 426.666667 0 0 0 512 85.333333z" fill="" p-id="2154"></path>
                                </svg>
                                <span>关于</span>
                            </div>
                        </div>
                        <div class="main">
                            
                        </div>
                    </div>
                </object>
            </button>
            <button class="card" data-cardmode="preview" data-cardid="friends" onclick="openCard(this)">
                <object>
                    <div class="previewArea">
                        <div class="cardHeader">
                            <div class="cardName">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M698.026667 597.333333c3.413333-28.16 5.973333-56.32 5.973333-85.333333 0-29.013333-2.56-57.173333-5.973333-85.333333h144.213333c6.826667 27.306667 11.093333 55.893333 11.093333 85.333333s-4.266667 58.026667-11.093333 85.333333m-219.733333 237.226667c25.6-47.36 45.226667-98.56 58.88-151.893333h125.866666a342.613333 342.613333 0 0 1-184.746666 151.893333M611.84 597.333333H412.16c-4.266667-28.16-6.826667-56.32-6.826667-85.333333 0-29.013333 2.56-57.6 6.826667-85.333333h199.68c3.84 27.733333 6.826667 56.32 6.826667 85.333333 0 29.013333-2.986667 57.173333-6.826667 85.333333M512 851.626667c-35.413333-51.2-64-107.946667-81.493333-168.96h162.986666c-17.493333 61.013333-46.08 117.76-81.493333 168.96M341.333333 341.333333H216.746667A338.048 338.048 0 0 1 401.066667 189.44C375.466667 236.8 356.266667 288 341.333333 341.333333m-124.586666 341.333334H341.333333c14.933333 53.333333 34.133333 104.533333 59.733334 151.893333A341.674667 341.674667 0 0 1 216.746667 682.666667m-34.986667-85.333334C174.933333 570.026667 170.666667 541.44 170.666667 512s4.266667-58.026667 11.093333-85.333333h144.213333c-3.413333 28.16-5.973333 56.32-5.973333 85.333333 0 29.013333 2.56 57.173333 5.973333 85.333333M512 171.946667c35.413333 51.2 64 108.373333 81.493333 169.386666h-162.986666c17.493333-61.013333 46.08-118.186667 81.493333-169.386666M807.253333 341.333333h-125.866666a667.733333 667.733333 0 0 0-58.88-151.893333c78.506667 26.88 143.786667 81.066667 184.746666 151.893333M512 85.333333C276.053333 85.333333 85.333333 277.333333 85.333333 512a426.666667 426.666667 0 0 0 426.666667 426.666667 426.666667 426.666667 0 0 0 426.666667-426.666667A426.666667 426.666667 0 0 0 512 85.333333z" fill="" p-id="2154"></path>
                                </svg>
                                <span>友链</span>
                            </div>
                        </div>
                        <div class="main">
                            <div class="siteSlug">
                                <?php
                                // if (count($friends_link) > 4) {
                                //     $friends_link_slug = getRandom($friends_link);
                                //     // print_r($friends_link_slug);
                                // }
                                // else
                                $friends_link_slug = $friends_link;
                                foreach ($friends_link_slug as $i => $site_info) {
                                ?>
                                    <div class="site">
                                        <i style="background-image: url('<?php echo $site_info['icon']; ?>');"></i>
                                        <div class="text">
                                            <div class="name"><?php echo $site_info['name']; ?></div>
                                            <div class="description"><?php echo $site_info['description']; ?></div>
                                        </div>
                                    </div>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="detailArea">
                        <div class="cardHeader">
                            <button class="close" placeholder="关闭" onclick="closeCard('friends')">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M544.448 499.2l284.576-284.576a32 32 0 0 0-45.248-45.248L499.2 453.952 214.624 169.376a32 32 0 0 0-45.248 45.248l284.576 284.576-284.576 284.576a32 32 0 0 0 45.248 45.248l284.576-284.576 284.576 284.576a31.904 31.904 0 0 0 45.248 0 32 32 0 0 0 0-45.248L544.448 499.2z"></path>
                                </svg>
                            </button>
                            <div class="cardName">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M698.026667 597.333333c3.413333-28.16 5.973333-56.32 5.973333-85.333333 0-29.013333-2.56-57.173333-5.973333-85.333333h144.213333c6.826667 27.306667 11.093333 55.893333 11.093333 85.333333s-4.266667 58.026667-11.093333 85.333333m-219.733333 237.226667c25.6-47.36 45.226667-98.56 58.88-151.893333h125.866666a342.613333 342.613333 0 0 1-184.746666 151.893333M611.84 597.333333H412.16c-4.266667-28.16-6.826667-56.32-6.826667-85.333333 0-29.013333 2.56-57.6 6.826667-85.333333h199.68c3.84 27.733333 6.826667 56.32 6.826667 85.333333 0 29.013333-2.986667 57.173333-6.826667 85.333333M512 851.626667c-35.413333-51.2-64-107.946667-81.493333-168.96h162.986666c-17.493333 61.013333-46.08 117.76-81.493333 168.96M341.333333 341.333333H216.746667A338.048 338.048 0 0 1 401.066667 189.44C375.466667 236.8 356.266667 288 341.333333 341.333333m-124.586666 341.333334H341.333333c14.933333 53.333333 34.133333 104.533333 59.733334 151.893333A341.674667 341.674667 0 0 1 216.746667 682.666667m-34.986667-85.333334C174.933333 570.026667 170.666667 541.44 170.666667 512s4.266667-58.026667 11.093333-85.333333h144.213333c-3.413333 28.16-5.973333 56.32-5.973333 85.333333 0 29.013333 2.56 57.173333 5.973333 85.333333M512 171.946667c35.413333 51.2 64 108.373333 81.493333 169.386666h-162.986666c17.493333-61.013333 46.08-118.186667 81.493333-169.386666M807.253333 341.333333h-125.866666a667.733333 667.733333 0 0 0-58.88-151.893333c78.506667 26.88 143.786667 81.066667 184.746666 151.893333M512 85.333333C276.053333 85.333333 85.333333 277.333333 85.333333 512a426.666667 426.666667 0 0 0 426.666667 426.666667 426.666667 426.666667 0 0 0 426.666667-426.666667A426.666667 426.666667 0 0 0 512 85.333333z" fill="" p-id="2154"></path>
                                </svg>
                                <span>友链</span>
                            </div>
                        </div>
                        <div class="main">
                            <div class="siteDetail">
                                <?php
                                foreach ($friends_link as $i => $site_info) {
                                ?>
                                    <a class="site" href="<?php echo $site_info['url']; ?>" target="_blank">
                                        <i style="background-image: url('<?php echo $site_info['icon']; ?>');"></i>
                                        <div class="text">
                                            <div class="name"><?php echo $site_info['name']; ?></div>
                                            <div class="url"><?php echo $site_info['host']; ?></div>
                                            <div class="description"><?php echo $site_info['description']; ?></div>
                                        </div>
                                    </a>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                </object>
            </button>
        </div>
    </div>
    </div>
    <div class="pageFooter" id="pageFooter">
        <p>Copyright <?php echo $site_header_name; ?>. All rights reserved.
    </div>
    </p>
    <script src="./src/js/jquery.min.js"></script>
    <script src="./src/js/main.js"></script>
</body>

</html>