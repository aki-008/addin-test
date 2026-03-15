/* global document, Office, Word */

// Replace this URL with your actual FastAPI backend URL
const FASTAPI_LOGIN_URL = "http://localhost:8000/token";

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    document.getElementById("sideload-msg").style.display = "none";

    // Check if the user is already logged in
    const token = localStorage.getItem("accessToken");
    if (token) {
      showAppBody();
    } else {
      showLoginBody();
    }

    // Attach event listeners
    document.getElementById("run").onclick = run;
    document.getElementById("login-btn").onclick = handleLogin;
    document.getElementById("logout-btn").onclick = handleLogout;
  }
});

function showLoginBody() {
  document.getElementById("app-body").style.display = "none";
  document.getElementById("login-body").style.display = "flex";
}

function showAppBody() {
  document.getElementById("login-body").style.display;
  document.getElementById("app-body").style.display;

  // Fetch and display the user's profile when the page loads
  loadUserProfile();
}

async function loadUserProfile() {
  const token = localStorage.getItem("accessToken");
  if (!token) return;

  try {
    const response = await fetch("http://localhost:8000/api/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      // Inject the username into the HTML header
      document.getElementById("user-welcome-header").innerText = `Welcome, ${data.username}!`;
    } else {
      // If the token is invalid or expired, log them out
      handleLogout();
    }
  } catch (error) {
    console.error("Failed to load user profile:", error);
    document.getElementById("user-welcome-header").innerText = "Welcome!";
  }
}

async function handleLogin() {
  const usernameInput = (document.getElementById("username") as HTMLInputElement).value;
  const passwordInput = (document.getElementById("password") as HTMLInputElement).value;
  const errorMsg = document.getElementById("login-error");

  // Format data for FastAPI's OAuth2PasswordRequestForm
  const formData = new URLSearchParams();
  formData.append("username", usernameInput);
  formData.append("password", passwordInput);

  try {
    const response = await fetch(FASTAPI_LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      // Store the token (e.g., JWT) to keep the user logged in
      localStorage.setItem("accessToken", data.access_token);
      errorMsg.style.display = "none";
      showAppBody();
    } else {
      errorMsg.style.display = "block";
      errorMsg.innerText = "Login failed. Please check your credentials.";
    }
  } catch (error) {
    console.error("Login error:", error);
    errorMsg.style.display = "block";
    errorMsg.innerText = "Error connecting to the server.";
  }
}

function handleLogout() {
  localStorage.removeItem("accessToken");
  showLoginBody();
}

export async function run() {
  return Word.run(async (context) => {
    // 1. Get the token from local storage
    const token = localStorage.getItem("accessToken");

    if (!token) {
      console.error("No token found. Please log in.");
      return;
    }

    try {
      // 2. Call the protected FastAPI route
      const response = await fetch("http://localhost:8000/api/run", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Inject the JWT here [cite: 84]
        },
      });

      if (response.ok) {
        const data = await response.json();

        // 3. Write the backend response to the Word Document
        const paragraph = context.document.body.insertParagraph(
          data.message,
          Word.InsertLocation.end
        );
        paragraph.font.color = "green";
      } else {
        const errorParagraph = context.document.body.insertParagraph(
          "API call failed. Token might be expired.",
          Word.InsertLocation.end
        );
        errorParagraph.font.color = "red";
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }

    await context.sync();
  });
}
