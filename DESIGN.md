# Mmm Food

A a mobile compatible food tracker web app that tracks servings of each of the food marcos, protein, carbohydrates, fat and alcohol.

## Use cases
* A user can increment or decrement the number of serving eaten in each category throughout the day. The total calories consumed so far will be shown. Uncrement and decrement buttons for each category should be large and easy to manipulate on a small screen, such as a phone.
* At midnight the total servings for each macro category will reset to 0.
* In a separate settings view, a user can configure the target daily number of servings for each macro category. The user will be shown the total number of calories if all these servings are eaten, as well as the number of calories in each category.
* Assume one serving of carbohydate and protein to be 25g each. Assume one serving of fat to be 13g. Assume 15g for one serving of alcohol. For any carbohydrate or protein eaten, assume
  an additional number of fat grams equal to 15% of the carbohydrate or protein grams eaten.

## Implementation
* Written using HTMLX and Alpine.js
* Persistent state will be stored in Pocketbase located at https://db.guymon.family
* No server-side rendering, the bundled site will be hosted statically
* Styles will be configured with Tailwind
