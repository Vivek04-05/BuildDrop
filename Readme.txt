
//// RESOURCES

1. https://chatgpt.com/c/68a84285-d660-832b-8017-637ca4d96db6 -> (mortaltechnical.gmail.com)

2. https://support.pressmatrix.com/hc/en-us/articles/208640329-How-do-I-distribute-my-app-via-In-House-Apple-Enterprise-Distribution-OTA#:~:text=%3Ckey%3Eassets%3C%2Fkey%3E%20%3Carray%3E%20%3Cdict%3E%20%3Ckey%3Ekind%3C%2Fkey%3E%20%3Cstring%3Esoftware,array






///////STEPS


// As I am using Local machine as server
1. configure and install ngrok server   in system (https://dashboard.ngrok.com/get-started/setup/macos). 

2. As we open project on Vscode so open terminal and run command 

COMMAND -> ngrok http 3000

NOTE - here port code should be match with "PORT" in index.js file . As i set 3000 , so i use it with ngrok also


3. After run it show something like this 

Session Status                online                                                                                                                    
Account                       mortaltechnical@gmail.com (Plan: Free)                                                                                    
Version                       3.26.0                                                                                                                    
Region                        India (in)                                                                                                                
Web Interface                 http://127.0.0.1:4040                                                                                                     
Forwarding                    https://ea7e193cc66c.ngrok-free.app -> http://localhost:3000  

 https://ea7e193cc66c.ngrok-free.app  ( Forwarding )-> It change everytime you run or restart  the ngrok .


 4. In index.js set "baseUrl"
  
  baseUrl =  https://ea7e193cc66c.ngrok-free.app 

5. Now start the local server (local host) (in diffrenet terminal tab)

   COMMAND -> node index.js


6. That command start the localhost and now open  http://localhost:3000 on web. browser.

7. upload the .ipa file and click on submt button (It may take time so i use progress bar for that) .

8. After upload it show a boutton (Install on iphone/ ipad) click on that and it will downlaod the app in your app .





NOTE -> EVERYTIME YOU RESTART it give you "baseUrl" (  https://ea7e193cc66c.ngrok-free.app) for index.js . Chnage it EVERYTIME.
