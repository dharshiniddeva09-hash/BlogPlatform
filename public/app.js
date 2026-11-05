const API = "/api";
const $ = (id) => document.getElementById(id);
let token = localStorage.getItem("blogToken") || "";
let currentUser = JSON.parse(localStorage.getItem("blogUser") || "null");
let authMode = "login";
let editingPostId = null;

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}
function showMessage(text, isError = false) {
  $("message").textContent = text;
  $("message").classList.remove("hidden", "error");
  if (isError) $("message").classList.add("error");
  window.scrollTo({ top: $("message").getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
}
function hideMessage() { $("message").classList.add("hidden"); }
function authHeaders() {
  return token ? { "Authorization": `Bearer ${token}` } : {};
}
async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...authHeaders(), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}
function updateNav() {
  const loggedIn = Boolean(token && currentUser);
  $("loginNav").classList.toggle("hidden", loggedIn);
  $("registerNav").classList.toggle("hidden", loggedIn);
  $("logoutBtn").classList.toggle("hidden", !loggedIn);
  $("writeHeroBtn").textContent = loggedIn ? "＋ Write a post" : "＋ Log in to write";
}
function openAuth(mode) {
  hideMessage();
  authMode = mode;
  $("authSection").classList.remove("hidden");
  $("editorSection").classList.add("hidden");
  $("authTitle").textContent = mode === "login" ? "Welcome back" : "Create your account";
  $("authSubtitle").textContent = mode === "login" ? "Log in to continue writing." : "Join the community and share your stories.";
  $("authSubmit").textContent = mode === "login" ? "Login" : "Create account";
  $("nameField").classList.toggle("hidden", mode === "login");
  $("name").required = mode === "register";
  $("password").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("authSwitch").innerHTML = mode === "login"
    ? 'New here? <button id="switchMode" class="text-button" type="button">Create an account</button>'
    : 'Already registered? <button id="switchMode" class="text-button" type="button">Log in</button>';
  $("switchMode").addEventListener("click", () => openAuth(authMode === "login" ? "register" : "login"));
  $("authSection").scrollIntoView({ behavior: "smooth", block: "center" });
}
function closePanels() {
  $("authSection").classList.add("hidden");
  $("editorSection").classList.add("hidden");
}
function openEditor(post = null) {
  if (!token) return openAuth("login");
  hideMessage();
  editingPostId = post ? post._id : null;
  $("editorTitle").textContent = post ? "Edit your post" : "Create a post";
  $("postTitle").value = post ? post.title : "";
  $("postContent").value = post ? post.content : "";
  $("postForm").querySelector('button[type="submit"]').textContent = post ? "Save changes" : "Publish post";
  $("editorSection").classList.remove("hidden");
  $("authSection").classList.add("hidden");
  $("editorSection").scrollIntoView({ behavior: "smooth", block: "center" });
}
function formatDate(value) {
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
async function loadPosts() {
  $("posts").innerHTML = '<div class="empty">Loading stories...</div>';
  try {
    const posts = await api("/posts");
    $("postCount").textContent = `${posts.length} ${posts.length === 1 ? "story" : "stories"}`;
    if (!posts.length) {
      $("posts").innerHTML = '<div class="empty"><h3>No stories yet</h3><p>Be the first to share an idea with the community.</p><button class="btn" id="emptyWrite">Write the first post</button></div>';
      $("emptyWrite").addEventListener("click", () => openEditor());
      return;
    }
    $("posts").innerHTML = posts.map(post => {
      const ownPost = currentUser && post.author && String(post.author._id) === String(currentUser.id);
      return `<article class="post-card" data-post="${escapeHTML(post._id)}">
        <div class="post-meta"><span>By ${escapeHTML(post.author?.name || "Unknown author")}</span><span>·</span><span>${formatDate(post.createdAt)}</span></div>
        <h3>${escapeHTML(post.title)}</h3>
        <div class="post-content">${escapeHTML(post.content)}</div>
        ${ownPost ? `<div class="post-actions"><button class="small-btn edit-post" data-id="${escapeHTML(post._id)}">Edit</button><button class="small-btn danger delete-post" data-id="${escapeHTML(post._id)}">Delete</button></div>` : ""}
        <section class="comments"><h4>Comments</h4><div class="comments-list">Loading comments...</div>
        <form class="comment-form" data-id="${escapeHTML(post._id)}"><input name="content" maxlength="2000" placeholder="${token ? "Write a comment..." : "Log in to comment"}" aria-label="Comment" required ${token ? "" : "disabled"}><button class="btn btn-small" type="submit" ${token ? "" : "disabled"}>Send</button></form></section>
      </article>`;
    }).join("");
    document.querySelectorAll(".edit-post").forEach(btn => btn.addEventListener("click", () => {
      const post = posts.find(item => item._id === btn.dataset.id);
      if (post) openEditor(post);
    }));
    document.querySelectorAll(".delete-post").forEach(btn => btn.addEventListener("click", async () => {
      if (!confirm("Delete this blog post and its comments?")) return;
      try { await api(`/posts/${btn.dataset.id}`, { method: "DELETE" }); showMessage("Post deleted."); await loadPosts(); }
      catch (err) { showMessage(err.message, true); }
    }));
    document.querySelectorAll(".comment-form").forEach(form => form.addEventListener("submit", submitComment));
    await Promise.all(posts.map(post => loadComments(post._id)));
  } catch (err) {
    $("postCount").textContent = "";
    $("posts").innerHTML = `<div class="empty">${escapeHTML(err.message)}<p>Make sure the server is running and MongoDB is connected.</p></div>`;
  }
}
async function loadComments(postId) {
  const card = document.querySelector(`[data-post="${CSS.escape(postId)}"]`);
  if (!card) return;
  const list = card.querySelector(".comments-list");
  try {
    const comments = await api(`/posts/${postId}/comments`);
    list.innerHTML = comments.length ? comments.map(comment => `<div class="comment"><strong>${escapeHTML(comment.author?.name || "User")} · ${formatDate(comment.createdAt)}</strong><p>${escapeHTML(comment.content)}</p></div>`).join("") : '<p class="post-meta">No comments yet. Start the conversation.</p>';
  } catch { list.textContent = "Comments could not be loaded."; }
}
async function submitComment(event) {
  event.preventDefault();
  if (!token) return openAuth("login");
  const form = event.currentTarget;
  const input = form.elements.content;
  try {
    await api(`/posts/${form.dataset.id}/comments`, { method: "POST", body: JSON.stringify({ content: input.value }) });
    input.value = "";
    await loadComments(form.dataset.id);
  } catch (err) { showMessage(err.message, true); }
}
$("authForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const mode = authMode;
  const payload = { email: $("email").value.trim(), password: $("password").value };
  if (mode === "register") payload.name = $("name").value.trim();
  try {
    const data = await api(`/auth/${mode === "login" ? "login" : "register"}`, { method: "POST", body: JSON.stringify(payload) });
    token = data.token; currentUser = data.user;
    localStorage.setItem("blogToken", token);
    localStorage.setItem("blogUser", JSON.stringify(currentUser));
    updateNav(); closePanels(); $("authForm").reset();
    showMessage(data.message); await loadPosts();
  } catch (err) { showMessage(err.message, true); }
});
$("postForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = { title: $("postTitle").value.trim(), content: $("postContent").value.trim() };
  try {
    const data = await api(editingPostId ? `/posts/${editingPostId}` : "/posts", {
      method: editingPostId ? "PUT" : "POST", body: JSON.stringify(payload)
    });
    closePanels(); $("postForm").reset(); editingPostId = null;
    showMessage(data.message); await loadPosts();
  } catch (err) { showMessage(err.message, true); }
});
$("loginNav").addEventListener("click", () => openAuth("login"));
$("registerNav").addEventListener("click", () => openAuth("register"));
$("writeHeroBtn").addEventListener("click", () => token ? openEditor() : openAuth("login"));
$("cancelEdit").addEventListener("click", () => { closePanels(); editingPostId = null; });
$("homeBtn").addEventListener("click", () => { closePanels(); hideMessage(); window.scrollTo({ top: 0, behavior: "smooth" }); });
$("logoutBtn").addEventListener("click", () => {
  token = ""; currentUser = null;
  localStorage.removeItem("blogToken"); localStorage.removeItem("blogUser");
  updateNav(); closePanels(); showMessage("You have logged out."); loadPosts();
});
updateNav();
loadPosts();
