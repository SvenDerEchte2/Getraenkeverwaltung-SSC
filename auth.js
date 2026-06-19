// Seite direkt verstecken (kein Flackern)
document.body.style.display = "none";

(async () => {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.replace("login.html");
    return;
  }

  document.body.style.display = "block";
})();

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.replace("index.html");
}