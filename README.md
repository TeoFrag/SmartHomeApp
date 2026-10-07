Software Prerequisites
To run the code, the evaluator's system must have the following:

Node.js & npm: The JavaScript execution environment. Proper installation is confirmed by running the commands node -v and npm -v in the terminal.

Expo Go: The viewing application for the mobile phone, available for free on the Google Play Store (for Android) or the Apple App Store (for iOS).

The application communicates live with a backend service (Supabase/PostgreSQL) to retrieve energy data and control the switches.

No local database installation is required: All necessary security keys (API keys, Authorization Bearer tokens) and REST API endpoints (e.g. 10.64.44.134:8000)
are already integrated and configured within the source code.

All that is required is for the device to have communication with the server's IP in order to load the live data into the charts.

After downloading the code, follow the steps below in the computer's terminal (e.g. Visual Studio Code Terminal).

Step 1: Navigate to the project folder
We ensure that the terminal is pointed to the main application folder and using the cd command we navigate to the correct folder where the project is located.

Step 2: Install Dependencies
To download all the necessary libraries (creating the node_modules), we execute: npm install

Code Startup and Execution
Step 3: Start the Local Server (Expo Metro)
To start the application avoiding local network and old cache issues, we execute the following command: npx expo start --clear --tunnel

Parameter explanation:
--clear: Clears the temporary memory (cache) to ensure that the most recent version of the code is executed.
--tunnel: Creates a secure tunnel allowing the mobile phone to easily connect to the computer's server, even if the two devices are not on the same local network.

Step 4: View on Mobile Phone
Once the above command is completed, a QR code will appear in the terminal.

For Android: Open the Expo Go app on the mobile phone, select "Scan QR Code" and scan the code.

For iOS: Open the iPhone Camera app, scan the QR Code and tap the "Open in Expo Go" notification.
