let sessionId = "";

window.onload = fetchCaptcha;

async function fetchCaptcha() {
  const res = await fetch("/api/v1/getCaptcha");
  const data = await res.json();

  sessionId = data.sessionId;
  document.getElementById("captchaImage").src = data.image;
  document.getElementById("captchaInput").value = "";
}

async function verifyGST() {
  const gstin = document.getElementById("gstin").value;
  const captcha = document.getElementById("captchaInput").value;

  const loader = document.getElementById("loader");
  const result = document.getElementById("result");
  const verifyBtn = document.getElementById("verifyBtn");

  // 🔥 Show loader
  loader.classList.remove("hidden");
  verifyBtn.disabled = true;
  result.innerHTML = "";

  try {
    const res = await fetch("/api/v1/getGSTDetails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        GSTIN: gstin,
        captcha
      })
    });

    const response = await res.json();
    console.log("API Response:", response);

    const data = response.data || response;

    // ❌ If error or captcha invalid
    if (!data || data.errorCode || data.error) {
      result.innerHTML = `<p style="color:red">Invalid GST or Captcha. Try again.</p>`;
      fetchCaptcha(); // 🔥 Auto refresh captcha
      return;
    }

    result.innerHTML = `
      <h3>GST Details</h3>
      <p><b>GSTIN:</b> ${data.gstin || "-"}</p>
      <p><b>Legal Name:</b> ${data.lgnm || "-"}</p>
      <p><b>Trade Name:</b> ${data.tradeNam || "-"}</p>
      <p><b>Status:</b> ${data.sts || "-"}</p>
      <p><b>Registration Date:</b> ${data.rgdt || "-"}</p>
      <p><b>Business Type:</b> ${data.ctb || "-"}</p>
      <p><b>Address:</b> ${data.pradr?.adr || "-"}</p>
    `;

  } catch (error) {
    result.innerHTML = `<p style="color:red">Something went wrong.</p>`;
    fetchCaptcha(); // refresh on error too
  } finally {
    // 🔥 Hide loader
    loader.classList.add("hidden");
    verifyBtn.disabled = false;
  }
}