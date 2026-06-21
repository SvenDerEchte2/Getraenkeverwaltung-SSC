// Seite direkt verstecken (kein Flackern)
document.body.style.display = "none";

(async () => {
  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    window.location.replace("index.html");
    return;
  }

  document.body.style.display = "block";
})();

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.replace("index.html");
}