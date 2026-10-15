# EPIC

Discussify is a social platform that allows users to create communities, join discussions, and share resources with others. It is a MERN STACK technology-based web application that is designed to cater to the needs of individuals who want to connect with like-minded people, share their thoughts, and engage in meaningful conversations.

The application is of professional complexity, and it offers a range of features that make it easy for users to interact with each other. The user interface is simple and intuitive, making it easy for even the most technologically challenged individuals to use the platform. Users can create their profiles, join communities, and participate in discussions on various topics.

One of the key features of Discussify is the ability to create communities. Users can create their own communities based on their interests and invite others to join. This feature allows users to connect with people who share similar interests and engage in discussions on topics that they are passionate about. The communities can be public or private, depending on the user's preference.

Another important feature of Discussify is the ability to join discussions. Users can browse through the various communities and join discussions on topics that interest them. They can share their thoughts, ask questions, and engage in debates with other members of the community. This feature allows users to learn from others, broaden their horizons, and gain new perspectives on various topics.

Finally, Discussify allows users to share resources with others. Users can share articles, videos, and other resources that they find interesting or informative. This feature allows users to learn from each other and stay up-to-date on the latest trends and developments in their respective fields.

Overall, Discussify is a powerful social platform that is designed to connect people, foster meaningful conversations, and facilitate the sharing of resources. Its MERN STACK technology- based web application ensures that it is fast, reliable, and easy to use. With its range of features and professional complexity, Discussify is sure to become a go-to platform for individuals who want to connect with others, share their thoughts, and engage in meaningful discussions.

---

# OVERALL REQUIREMENTS

The web app shown in the reference video only shows the minimum requirements for the application. Aspects like web accessibility which leads to a better user experience, better error handling etc. should also be implemented. Your implementation of theDiscussify web app should be an improvisation on it.

1. Use GIT for code integration and management. At-least one git push per trainee, per day is required.
2. Use Material design components wherever necessary.
3. Add appropriate validations wherever necessary. For example, you should be validating that the trip start date is not before today.
4. Appropriate error messages should be provided for any such validations done above.
5. The Error or Success messages should be populated based on the requirement and it should be appropriate.
6. There should not be any spelling or grammatical mistakes.
7. The website should have a uniform color theme.
8. Refer to the styles.css file for styling your web app.
9. Make web accessibility a part of your design and development. The reference video does not implement this.

---

# PRODUCT BACKLOG

### **User Story - 1**

| Description | Story Points |
| :--- | :---: |
| As a new user, I should be able to create an account and login to the platform | 5 |
| **<u>Priority / MoSCoW parameters :</u>**<br><br>**<u>Must Have :</u>**<br>1. User should be able to create a new account with a unique email and password<br>2. User should be able to login to the platform using their email and password<br><br>**<u>Should Have :</u>**<br>1. User should be able to reset their password if forgotten<br><br>**<u>Should Have :</u>**<br><br>**<u>Won't Have :</u>** | |
| **<u>Acceptance Criteria :</u>**<br><br>**<u>Dos / Positive points :</u>**<br>1. User should receive a confirmation email upon successful account creation<br>2. User should be redirected to their profile page upon successful login<br><br>**<u>Don'ts / Negative points :</u>**<br>1. User should not be able to create an account with an existing email<br>2. User should not be able to login with incorrect credentials | |

---

### **User Story - 2**

| Description | Story Points |
| :--- | :---: |
| As a user, I should be able to create and manage my profile | 3 |
| **<u>Priority / MoSCoW parameters :</u>**<br><br>**<u>Must Have :</u>**<br>1. User should be able to edit their profile information<br>2. User should be able to upload a profile picture<br><br>**<u>Should Have :</u>**<br>1. User should be able to view their activity on the platform<br><br>**<u>Should Have :</u>**<br><br>**<u>Won't Have :</u>** | |
| **<u>Acceptance Criteria :</u>**<br><br>**<u>Dos / Positive points :</u>**<br>1. User should be able to successfully update their profile information<br>2. User should be able to see their activity on the platform<br><br>**<u>Don'ts / Negative points :</u>**<br>1. User should not be able to upload an image that exceeds the maximum size limit<br>2. User should not be able to edit their email address | |

---

### **User Story - 3**

| Description | Story Points |
| :--- | :---: |
| As a user, I should be able to create a community and invite others to join | 5 |
| **<u>Priority / MoSCoW parameters :</u>**<br><br>**<u>Must Have :</u>**<br>1. User should be able to create a new community<br>2. User should be able to invite others to join the community<br><br>**<u>Should Have :</u>**<br>1. User should be able to edit the community information<br><br>**<u>Should Have :</u>**<br><br>**<u>Won't Have :</u>** | |
| **<u>Acceptance Criteria :</u>**<br><br>**<u>Dos / Positive points :</u>**<br>1. User should be able to successfully create a new community<br>2. User should be able to invite others to join the community<br><br>**<u>Don'ts / Negative points :</u>**<br>1. User should not be able to create a community with a name that already exists<br>2. User should not be able to invite a user who is already a member of the community | |

---

### **User Story - 4**

| Description | Story Points |
| :--- | :---: |
| As a user, I should be able to join a community and participate in discussions | 5 |
| **<u>Priority / MoSCoW parameters :</u>**<br><br>**<u>Must Have :</u>**<br>1. User should be able to join a community<br>2. User should be able to participate in discussions<br><br>**<u>Should Have :</u>**<br>1. User should be able to search for communities based on keywords<br><br>**<u>Should Have :</u>**<br><br>**<u>Won't Have :</u>** | |
| **<u>Acceptance Criteria :</u>**<br><br>**<u>Dos / Positive points :</u>**<br>1. User should be able to successfully join a community<br>2. User should be able to participate in discussions<br><br>**<u>Don'ts / Negative points :</u>**<br>1. User should not be able to join a private community without an invitation<br>2. User should not be able to participate in discussions if they are not a member of the community | |

---

### **User Story - 5**

| Description | Story Points |
| :--- | :---: |
| As a user, I should be able to share resources with others in a community | 3 |
| **<u>Priority / MoSCoW parameters :</u>**<br><br>**<u>Must Have :</u>**<br>1. User should be able to share articles, videos, and other resources with others in a community<br><br>**<u>Should Have :</u>**<br>1. User should be able to view resources shared by others<br><br>**<u>Should Have :</u>**<br><br>**<u>Won't Have :</u>** | |
| **<u>Acceptance Criteria :</u>**<br><br>**<u>Dos / Positive points :</u>**<br>1. User should be able to successfully share resources with others in a community<br>2. User should be able to view resources shared by others<br><br>**<u>Don'ts / Negative points :</u>**<br>1. User should not be able to share a resource that exceeds the maximum size limit<br>2. User should not be able to share inappropriate content | |

---

### **User Story - 6**

| Description | Story Points |
| :--- | :---: |
| As an admin, I should be able to manage communities and users | 8 |
| **<u>Priority / MoSCoW parameters :</u>**<br><br>**<u>Must Have :</u>**<br>1. Admin should be able to delete communities and users<br><br>**<u>Should Have :</u>**<br>1. Admin should be able to edit community and user information<br><br>**<u>Should Have :</u>**<br><br>**<u>Won't Have :</u>** | |
| **<u>Acceptance Criteria :</u>**<br><br>**<u>Dos / Positive points :</u>**<br>1. Admin should be able to successfully delete communities and users<br>2. Admin should be able to edit community and user information<br><br>**<u>Don'ts / Negative points :</u>**<br>1. Admin should not be able to delete a community with active discussions<br>2. Admin should not be able to edit a user's email address | |

---

### **User Story - 7**

| Description | Story Points |
| :--- | :---: |
| As a user, I should be able to receive notifications for new discussions and resources in my communities | 3 |
| **<u>Priority / MoSCoW parameters :</u>**<br><br>**<u>Must Have :</u>**<br>1. User should receive notifications for new discussions and resources in their communities<br><br>**<u>Should Have :</u>**<br>1. User should be able to manage their notification settings<br><br>**<u>Should Have :</u>**<br><br>**<u>Won't Have :</u>** | |
| **<u>Acceptance Criteria :</u>**<br><br>**<u>Dos / Positive points :</u>**<br>1. User should receive notifications for new discussions and resources in their communities<br>2. User should be able to manage their notification settings<br><br>**<u>Don'ts / Negative points :</u>**<br>1. User should not receive notifications for discussions and resources in communities they have left<br>2. User should not be able to turn off all notifications | |