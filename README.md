# ASMRdb API

## Introduction
[ASMRdb](asmrdb.net) is a site for ASMR enthusiasts. The idea is to have users collect and document information on ASMR YouTubers in a database in order to make it easier to find or discover content. For the most part, users have equal power on the website. It is one of the first projects I have written the frontend and backend for. I plan to keep updating it. It is [project 9](https://anthonyargel.com/blog/#/blog/60a19683489181001535cef3) of the [challenge](https://anthonyargel.com/blog/#/blog/6087a2dafedb56001512312d) I set for myself in 2021.

## Implementation
The backend uses Node, Express, and MongoDB (mongoose). 
I tried my best to apply the concepts of CRUD and REST as well as sanitization and validation.
Resources: Users, Channels, Tags, Comments, Channel Reviews

The frontend code can be found [here](https://github.com/anthony-argel/asmrdb-frontend).

## Security
The Express middlewares: Passport and Bcrypt are used to secure user information. Passport handles authenticaton and Bcrypt encrypts the passwords of users. JSON web tokens are used to authenticate once a user is logged in. Tokens do expire.

## To-Do
1. Add a discussion system (forum? imageboard?)
2. Log all user actions 
3. Add a report system
4. User profile and settings
5. Email verification

## Thoughts
My first big thought is that the site is tightly couple with YouTube channels. That is, a YouTube channel URL is needed to create a channel resource on ASMRdb. Not a bad thing, but might be short-sighted by me. Also, I'm not entirely confident with the API yet. I took an information/cyber security course in college, but I'm not confident the site is secure yet. Send me a message on [Twitter](https://twitter.com/Anthony_Argel) if you find bugs or security issues. I'd really appreciate.