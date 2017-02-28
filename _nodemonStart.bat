@REM redirection >log.txt 2>&1
@REM http://www.robvanderwoude.com/battech_redirection.php

@REM using default --dbpath /data/db
@REM START "MongoDB" mongod.exe --auth
@REM @SET f=_logMongo.txt
@REM START "MongoDB" CMD.EXE /C "@ECHO output redirected to %f% ...>CON & mongod.exe --auth >%f% 2>&1"

@REM https://github.com/remy/nodemon
@REM best installed globally
START "NodeJS" nodemon.cmd server.js
@REM @SET f=_logNode.txt
@REM START "NodeJS" CMD.EXE /C "@ECHO output redirected to %f% ...>CON & nodemon.cmd server.js >%f% 2>&1"