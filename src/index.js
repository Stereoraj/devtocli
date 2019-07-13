#! /usr/bin/env node

const program = require('commander');
const opn = require('opn');
const escExit = require('esc-exit');

const crawler = require('./util/crawler');
const countdown = require('./util/spinner');
const prompt = require('./util/prompt');
const showProfile = require('./util/profile');

let articles;

escExit();

const openLink = (answers) => {
    opn(articles.find(data => data.title === answers.title).link);
    process.exit();
}

/**
 * This is a function to show the prompt for the articles passed
 * @param {array<Object>} articles 
 * @returns {null} null
 */

const postPrompt = (articles) => {
    prompt.showPosts(articles.map(data => data.title)).then(answers => {
        openLink(answers);
    });
}

/**
 * This is a function to fetch top posts of a tags.
 * @param {string} tag - tag by which posts will be fetched
 * @returns {null} null
 */

const showPostsByTags = (tag) => {
    countdown.start();
    crawler.fetchByTags(tag).then(data => {
        countdown.stop();
        articles = data.filter(data => data.title != undefined);
        postPrompt(articles);
    });
}

/**
 * This is a function to fetch top posts by time.
 * @param {string} timeline - timeline by which posts will be fetched
 * @returns {null} null
 */

const showPostsByTimeline = (timeline) => {
    countdown.start();
    crawler.fetchTop(timeline).then(data => {
        countdown.stop();
        articles = data.filter(data => data.title != undefined);
        postPrompt(articles);
    })
}

/**
 * This is a function to display the profile details of the author.
 * @param {string} username - username of the author
 * @returns {null} null
 */

const showAuthorProfile = (username) => {
    countdown.start();
    crawler.fetchAuthorProfile(username).then((profileInfo) => {
        countdown.stop();
        if (!profileInfo.name) {
            console.error("😱 User not found. Please try again.");
            process.exit(1);
        }
        showProfile(profileInfo);
    });
}

program
    .version('1.4.7')

program
    .command("top [timeline]")
    .action((timeline) => {

        if (timeline)
            showPostsByTimeline(timeline);

        else
            prompt.selectTimline().then(answers => showPostsByTimeline(answers.timeline));

    })

program
    .command("tag [tag]")
    .alias("t")
    .action((tag) => {

        if (tag) showPostsByTags(tag);

        else {
            crawler.fetchTags().then(data => {
                prompt.searchTags(data).then((answers) => {
                    showPostsByTags(answers.tag);
                });
            });
        }
    })

program
    .command("latest")
    .alias("l")
    .action(() => {
        countdown.start();

        crawler.fetchLatest().then(data => {
            countdown.stop();
            articles = data.filter(data => data.title != undefined);
            postPrompt(articles);
        })
        
    })

program
    .command("search <keyword>")
    .alias("s")
    .action((keyword) => {
        countdown.start();
        crawler.searchPost(keyword).then(data => {
            countdown.stop();
            articles = data.hits.map(post => {
                return {
                    title: post.title,
                    link: "https://dev.to" + post.path
                }
            });
            postPrompt(articles);
        });
    })

program
    .command("author <username>")
    .option("-p, --profile", "Show author profile")
    .alias("a")
    .action((username, cmd) => {
        if (cmd.profile) {
            showAuthorProfile(username);
        } else {
            countdown.start();
            crawler.fetchByAuthor(username).then(data => {
                countdown.stop();
                articles = data.filter(data => data.title != undefined);
                postPrompt(articles);
            });
        }
    })

// error on unknown commands
program.on('command:*', function () {
    console.error('Invalid command: %s\nSee --help for a list of available commands.', program.args.join(' '));
    process.exit(1);
  });

program.parse(process.argv);

if (program.args.length === 0) {
    countdown.start();
    crawler.fetchHome().then(data => {
        countdown.stop();
        articles = data.filter(data => data.title != undefined);
        postPrompt(articles);
    })
}