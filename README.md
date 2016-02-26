------------
Infinito Q's
------------

It is a Question Bank Generation and Management app developed by  a team of four developers i.e. Prithvi Raj, Nishant, Manish and Penchalaiah during the  full stack developer training at NIIT StackRoute in Bengaluru.
Our app was developed using MEAN Stack(Mongo,Express,Angular,Node).

------------------
Question Generator
------------------
  This App uses WIKIDATA as its main Data Source for generating questions.

    There are two main features of the App :-
      1) Generate Question Pattern
      2) Execute Question Pattern

    Generate Question Pattern
      1) Users Shall be required to provide a sample question.
      2) Sample question like "Sachin Tendulkar is from which country ?",if You tend to generate questions of pattern "Cricketer from which country"
      3) Then our App will ask a series of questions to understand what exactly user meant by his question.
      4) Finally App will generate a list of Sample questions.
      5) If one is happy with the output, they can go ahead and save the question Pattern / Stub

    Generate Questions From Question Pattern
      1) Here You shall see a list of patterns that you would have saved.
      2) You can click on the refresh button (Available against each pattern) to refresh the question bank
      3) Once the questions are written down successfully our app shall display total generated questions and how many were successfully inserted
      4) Note that it will not overwrite already present questions.

-------------------
Question Management
-------------------
  Question management has been provided with an authentication layer using passport.js and its an interface for managing questions at very high scale.
  As the questions are generated from Wikidata(a shorter-version of Wikipedia) and Wikipedia is editable, data is prone to errors.Also Wikidata is growing day-by-day.This tools purpose is mainly to remove faulty data.
  We have included the functionalities of an editor interface such as Search,Edit,Delete,Multiple Select & Delete,Dynamic pagination etc..

------------------------
Execution Steps
------------------------

1. For windows users using virtual box, install vagrant,  oracle virtualbox, gitbash.
2. Create a new folder named vagrant in your C drive.
3. Clone the repository available in the https://github.com/stackroute/StackRoute-Vagrant-Node5-Mongo3.2 or download the zip files.
4. Do the vagrant up for this repository in the gitbash.
5. Now establish a secure connection with the ubuntu machine using vagrant ssh in gitbash.
6. Move to the Infinito Q's directory inside the ubuntu machine.
7. Move to QuestionGenerator directory for generating questions and QuestionManagement directory for managing questions.
8. Run the following commands:
  (i) npm install
  (ii) npm start
9. Now app will start.
10. Execute your ip address:<host-port>/ to run the app in your host browser.


So Have a Go and Enjoy this App.

Copyright {2016} {NIIT Limited, Wipro Limited}

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

   Name of Developers Prithvi Raj, Nishant, Manish and Penchalaiah.
