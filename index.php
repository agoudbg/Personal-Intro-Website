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
                            <button class="close" title="关闭" alt="关闭" onclick="closeCard('site')">
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
                                <svg t="1678067962516" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9131">
                                    <path d="M736 736c-17.664 0-32 14.336-32 32v36.544c0 24.832-17.856 27.712-31.296 27.712L210.88 832c-10.944 0-18.88-8.768-18.88-20.736V149.952c0-10.88 6.144-21.952 17.792-21.952H576v96c0 17.664 12.032 32 29.76 32H704v64c0 17.664 14.336 32 32 32s32-14.336 32-32V211.136L611.968 64H209.792C163.968 64 128 101.76 128 149.952v661.312C128 858.752 164.416 896 210.816 896l461.824 0.256c65.792 0 95.296-46.08 95.296-91.712V768c0.064-17.664-14.272-32-31.936-32z m-96-557.632L654.4 192H640v-13.632zM285.184 320h192c17.664 0 32-14.336 32-32s-14.336-32-32-32h-192c-17.664 0-32 14.336-32 32s14.336 32 32 32z m0 192h256c17.664 0 32-14.336 32-32s-14.336-32-32-32h-256c-17.664 0-32 14.336-32 32s14.336 32 32 32z m711.168-158.528l-55.104-55.168c-21.824-21.824-60.096-21.888-82.048 0l-232.64 232.64L594.368 640H285.184c-17.664 0-32 14.336-32 32s14.336 32 32 32h342.4c0.768 0 1.408-0.384 2.176-0.448 2.368 0.384 4.544 1.728 6.976 1.728l127.104-37.312 232.576-232.576c22.528-22.528 22.528-59.328-0.064-81.92zM729.856 611.52l-66.432 20.544 19.904-67.392L823.104 424.96l46.656 46.656L729.856 611.52z m185.088-185.088l-46.656-46.656 31.936-32 46.656 46.656-31.936 32z" p-id="9132"></path>
                                </svg>
                                <span>博客</span>
                            </div>
                        </div>
                        <div class="main">
                            <div class="blogSlug">
                                <?php
                                $blog_result = json_decode(curl_get($blog_api));
                                foreach ($blog_result->data as $i => $blog_article) {
                                    if ($i > 1) break;
                                ?>
                                    <div class="blog">
                                        <div class="title"><?php echo $blog_article->title; ?></div>
                                        <div class="slug markdownContent"><?php echo $blog_article->text; ?></div>
                                    </div>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="detailArea">
                        <div class="cardHeader">
                            <button class="close" title="关闭" alt="关闭" onclick="closeCard('blog')">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M544.448 499.2l284.576-284.576a32 32 0 0 0-45.248-45.248L499.2 453.952 214.624 169.376a32 32 0 0 0-45.248 45.248l284.576 284.576-284.576 284.576a32 32 0 0 0 45.248 45.248l284.576-284.576 284.576 284.576a31.904 31.904 0 0 0 45.248 0 32 32 0 0 0 0-45.248L544.448 499.2z"></path>
                                </svg>
                            </button>
                            <div class="cardName">
                                <svg t="1678067962516" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="9131">
                                    <path d="M736 736c-17.664 0-32 14.336-32 32v36.544c0 24.832-17.856 27.712-31.296 27.712L210.88 832c-10.944 0-18.88-8.768-18.88-20.736V149.952c0-10.88 6.144-21.952 17.792-21.952H576v96c0 17.664 12.032 32 29.76 32H704v64c0 17.664 14.336 32 32 32s32-14.336 32-32V211.136L611.968 64H209.792C163.968 64 128 101.76 128 149.952v661.312C128 858.752 164.416 896 210.816 896l461.824 0.256c65.792 0 95.296-46.08 95.296-91.712V768c0.064-17.664-14.272-32-31.936-32z m-96-557.632L654.4 192H640v-13.632zM285.184 320h192c17.664 0 32-14.336 32-32s-14.336-32-32-32h-192c-17.664 0-32 14.336-32 32s14.336 32 32 32z m0 192h256c17.664 0 32-14.336 32-32s-14.336-32-32-32h-256c-17.664 0-32 14.336-32 32s14.336 32 32 32z m711.168-158.528l-55.104-55.168c-21.824-21.824-60.096-21.888-82.048 0l-232.64 232.64L594.368 640H285.184c-17.664 0-32 14.336-32 32s14.336 32 32 32h342.4c0.768 0 1.408-0.384 2.176-0.448 2.368 0.384 4.544 1.728 6.976 1.728l127.104-37.312 232.576-232.576c22.528-22.528 22.528-59.328-0.064-81.92zM729.856 611.52l-66.432 20.544 19.904-67.392L823.104 424.96l46.656 46.656L729.856 611.52z m185.088-185.088l-46.656-46.656 31.936-32 46.656 46.656-31.936 32z" p-id="9132"></path>
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
                                        <div class="slug markdownContent"><?php echo $blog_article->text; ?></div>
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
                                <svg t="1678068023594" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="11834">
                                    <path d="M947.3 853.9c-32.5-150.1-134.1-260.9-268-311.2 70.9-57.1 112.3-149.4 97.1-250.5C758.8 175 661.2 81.1 543.5 67.4 381 48.5 243.1 175 243.1 333.8c0 84.5 39.2 159.7 100.2 208.9-133.8 50.3-235.4 161.1-268 311.2-11.8 54.6 32.1 105.7 88 105.7h695.9c55.9 0 99.9-51.1 88.1-105.7zM332.5 333.8c0-98.6 80.2-178.8 178.8-178.8s178.8 80.2 178.8 178.8-80.2 178.8-178.8 178.8-178.8-80.3-178.8-178.8z m466.2 536.4H224c-30.9 0-53.8-31.2-42.1-59.8C236 677.8 363.2 602 511.3 602c148.2 0 275.3 75.9 329.4 208.4 11.8 28.6-11.1 59.8-42 59.8z" p-id="11835"></path>
                                </svg>
                                <span>关于</span>
                            </div>
                        </div>
                        <div class="main myMain">
                            <div class="myIntroPreview">
                                <?php echo $about_text;
                                ?>
                            </div>
                        </div>
                    </div>
                    <div class="detailArea">
                        <div class="cardHeader">
                            <button class="close" title="关闭" alt="关闭" onclick="closeCard('about')">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M544.448 499.2l284.576-284.576a32 32 0 0 0-45.248-45.248L499.2 453.952 214.624 169.376a32 32 0 0 0-45.248 45.248l284.576 284.576-284.576 284.576a32 32 0 0 0 45.248 45.248l284.576-284.576 284.576 284.576a31.904 31.904 0 0 0 45.248 0 32 32 0 0 0 0-45.248L544.448 499.2z"></path>
                                </svg>
                            </button>
                            <div class="cardName">
                                <svg t="1678068023594" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="11834">
                                    <path d="M947.3 853.9c-32.5-150.1-134.1-260.9-268-311.2 70.9-57.1 112.3-149.4 97.1-250.5C758.8 175 661.2 81.1 543.5 67.4 381 48.5 243.1 175 243.1 333.8c0 84.5 39.2 159.7 100.2 208.9-133.8 50.3-235.4 161.1-268 311.2-11.8 54.6 32.1 105.7 88 105.7h695.9c55.9 0 99.9-51.1 88.1-105.7zM332.5 333.8c0-98.6 80.2-178.8 178.8-178.8s178.8 80.2 178.8 178.8-80.2 178.8-178.8 178.8-178.8-80.3-178.8-178.8z m466.2 536.4H224c-30.9 0-53.8-31.2-42.1-59.8C236 677.8 363.2 602 511.3 602c148.2 0 275.3 75.9 329.4 208.4 11.8 28.6-11.1 59.8-42 59.8z" p-id="11835"></path>
                                </svg>
                                <span>关于</span>
                            </div>
                        </div>
                        <div class="main">
                            <div class="myIntroDetail">
                                <?php echo $about_text; ?>
                            </div>
                            <div class="contacts">
                                <?php
                                foreach ($about_contacts as $i => $about_contact) {
                                ?>
                                    <a class="contact" href="<?php echo $about_contact['link']; ?>" target="_blank">
                                        <i style="background-image: url('/src/img/contactlogos/<?php echo $about_contact['id']; ?>.png');"></i>
                                        <p><?php echo $about_contact['text']; ?></p>
                                    </a>
                                <?php
                                }
                                ?>
                            </div>
                        </div>
                    </div>
                </object>
            </button>
            <button class="card" data-cardmode="preview" data-cardid="friends" onclick="openCard(this)">
                <object>
                    <div class="previewArea">
                        <div class="cardHeader">
                            <div class="cardName">
                                <svg t="1678068084781" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="14132">
                                    <path d="M894.528 150.4a195.072 195.072 0 0 0-270.912-52.288L359.424 276.992a195.072 195.072 0 0 0-52.16 270.912c56.768 83.904 167.04 108.288 254.208 60.736l-0.384-0.832c1.92-0.896 3.904-1.216 5.76-2.432a34.496 34.496 0 1 0-35.52-59.2H531.2l-0.448-0.768c-57.344 34.56-128.64 24.128-166.656-32.064a127.552 127.552 0 0 1 34.112-177.152l258.816-175.168a127.552 127.552 0 0 1 177.152 34.112c39.488 58.368 26.816 127.488-31.552 166.976l-39.488 27.52a35.392 35.392 0 1 0 39.68 58.624c0.32-0.192 0.448-0.576 0.768-0.768l38.72-26.176a195.072 195.072 0 0 0 52.224-270.912z" p-id="14133"></path>
                                    <path d="M453.888 411.328l0.448 0.832c-1.92 0.896-3.968 1.28-5.76 2.56a34.496 34.496 0 1 0 36.992 58.24l0.064 0.128 0.512 0.64c56.448-35.968 128-27.264 167.424 28.032 40.96 57.344 27.584 136.96-29.76 177.92L369.28 861.184c-57.344 40.896-136.96 27.52-177.92-29.76-40.896-57.344-29.952-126.784 27.456-167.68l38.784-28.544a35.392 35.392 0 1 0-41.088-57.6c-0.32 0.192-0.448 0.576-0.768 0.768l-38.08 27.136a195.072 195.072 0 0 0 226.56 317.632l259.712-185.28a195.072 195.072 0 0 0 45.504-272.128c-58.816-82.432-169.6-104.064-255.616-54.4z" p-id="14134"></path>
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
                            <button class="close" title="关闭" alt="关闭" onclick="closeCard('friends')">
                                <svg class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M544.448 499.2l284.576-284.576a32 32 0 0 0-45.248-45.248L499.2 453.952 214.624 169.376a32 32 0 0 0-45.248 45.248l284.576 284.576-284.576 284.576a32 32 0 0 0 45.248 45.248l284.576-284.576 284.576 284.576a31.904 31.904 0 0 0 45.248 0 32 32 0 0 0 0-45.248L544.448 499.2z"></path>
                                </svg>
                            </button>
                            <div class="cardName">
                                <svg t="1678068084781" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="14132">
                                    <path d="M894.528 150.4a195.072 195.072 0 0 0-270.912-52.288L359.424 276.992a195.072 195.072 0 0 0-52.16 270.912c56.768 83.904 167.04 108.288 254.208 60.736l-0.384-0.832c1.92-0.896 3.904-1.216 5.76-2.432a34.496 34.496 0 1 0-35.52-59.2H531.2l-0.448-0.768c-57.344 34.56-128.64 24.128-166.656-32.064a127.552 127.552 0 0 1 34.112-177.152l258.816-175.168a127.552 127.552 0 0 1 177.152 34.112c39.488 58.368 26.816 127.488-31.552 166.976l-39.488 27.52a35.392 35.392 0 1 0 39.68 58.624c0.32-0.192 0.448-0.576 0.768-0.768l38.72-26.176a195.072 195.072 0 0 0 52.224-270.912z" p-id="14133"></path>
                                    <path d="M453.888 411.328l0.448 0.832c-1.92 0.896-3.968 1.28-5.76 2.56a34.496 34.496 0 1 0 36.992 58.24l0.064 0.128 0.512 0.64c56.448-35.968 128-27.264 167.424 28.032 40.96 57.344 27.584 136.96-29.76 177.92L369.28 861.184c-57.344 40.896-136.96 27.52-177.92-29.76-40.896-57.344-29.952-126.784 27.456-167.68l38.784-28.544a35.392 35.392 0 1 0-41.088-57.6c-0.32 0.192-0.448 0.576-0.768 0.768l-38.08 27.136a195.072 195.072 0 0 0 226.56 317.632l259.712-185.28a195.072 195.072 0 0 0 45.504-272.128c-58.816-82.432-169.6-104.064-255.616-54.4z" p-id="14134"></path>
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
        <p>Copyright <?php echo $site_header_name; ?>. All rights reserved.</p>
        <p><?php echo $site_footer; ?></p>
    </div>
    </p>
    <script src="./src/js/jquery.min.js"></script>
    <script src="./src/js/marked.min.js"></script>
    <script src="./src/js/main.js"></script>
</body>

</html>