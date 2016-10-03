Todo Challenge by Joseph Cumines
=============

This project is currently live at [todo.joeycumines.me](http://todo.joeycumines.me).

## Technologies Used
### Symfony 2.8
As specified by the outline I used Symfony 2.8. I had never used it before so there
was quite a learning curve, but I was pleasantly surprised by how useful and well
designed it was.
#### FOSUserBundle
As specified by the outline I implemented FOSUserBundle. I used MongoDB for
persistence, and only customized the basic style for the pages provided, all
the forms etc are default, but I linked the registration page etc.
#### DoctrineMongoDBBundle
I used the doctrine mongodb bundle directly to access and manipulate the Todo items.
### MongoDB
I was familiar with Mongo so it was an easy choice.
### PHPUnit
I wrote unit testing on the API using PHPUnit. I found it easy to learn and use.
### React and ReactDOM
I had been meaning to learn how to use React for months and this finally gave me a
good excuse. Will definitely be using this more.
### Bootstrap 4
I have used Bootstrap 3 for many things, so I decided to try out the "new" alpha.
No glyphicons in this one so I didnt bother using any.
### PHP 5.6 and Apache
I deployed it to Apache server once I completed development.

## Setup
It should be simple to setup in dev mode, I used PHP's in-built server to 
run it locally. Composer should be used to setup dependencies and settings.

[This seems to be a good guide](https://www.digitalocean.com/community/tutorials/how-to-deploy-a-symfony-application-to-production-on-ubuntu-14-04)

## Other notes
I am using the dev version of Babel, and the site is not optimised, not that it
matters for such a project. 

The todo page (root to app.php) includes scripts that
need to access the /todo routes. I had troubling getting it to work on both
Apache (which I couldnt figure out how to get it to use app.php as the directory
index without breaking all the routes. I am sure there is a way.) and the dev
server (defaults to app.php as the directory index), but it should be working for
both now.

The swiftmailer config option "host" has been disabled in config, since I was
using the shortcut to setup gmail in testing. As it is swiftmailer doesn't do anything
because I haven't created the email reset template.