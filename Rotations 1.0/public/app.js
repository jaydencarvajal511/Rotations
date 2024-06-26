const auth = firebase.auth();

const whenSignedIn = document.getElementById("whenSignedIn");
const whenSignedOut = document.getElementById("whenSignedOut");

const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");

const userDetails = document.getElementById("userDetails");

const provider = new firebase.auth.GoogleAuthProvider();

const CLIENT_ID = "fd71ab4b2dac4c4fa851139a48455d0e";
const CLIENT_SECRET = "691879d437c3461b999948e92374163a";

// API ACCESS TOKEN

var authParameters = {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
  body: "grant_type=client_credentials&client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET,
};

fetch("https://accounts.spotify.com/api/token", authParameters)
  .then((result) => result.json())
  .then((data) => {
    accessToken = data.access_token;
  });

let albumData;
let page = "search";
originalListenedOrder = [];
originalWantToListenOrder = [];
reverseListenedOrder = [];
reverseWantToListenOrder = [];

/// Sign in event handlers

signInBtn.onclick = () => auth.signInWithPopup(provider);

signOutBtn.onclick = () => auth.signOut();

auth.onAuthStateChanged((user) => {
  if (user) {
    // signed in
    whenSignedIn.hidden = false;
    whenSignedIn.style.display = "inherit";
    whenSignedOut.hidden = true;
    whenSignedOut.style.display = "none";
    // userDetails.innerHTML = `<h3>Hello ${user.displayName}!</h3> <p>User ID: ${user.uid}</p>`;
  } else {
    // not signed in
    whenSignedIn.hidden = true;
    whenSignedIn.style.display = "none";
    whenSignedOut.hidden = false;
    whenSignedOut.style.display = "flex";
    // userDetails.innerHTML = "";
  }
});

// reuasable functions

function resetPopup() {
  listenedButton.classList.remove("rollAnimation");
  wantToListenButton.classList.remove("rollAnimation");
  recommendButton.classList.remove("rollAnimation");
  document.getElementById("rating").style.display = "none";
  document.getElementById("confirmButton").style.display = "none";
  document.getElementById("rating").classList.remove("rating");
  document.getElementsByClassName("saveOption")[0].classList.remove("submitBar");
  listenedButton.style.display = "block";
  wantToListenButton.style.display = "block";
  recommendButton.style.display = "block";
  document.getElementById("searchTerm").value = "";
  document.getElementsByClassName("popup")[0].style.display = "none";
  listenedButton.classList.remove("fadeOutAnimation");
  recommendButton.classList.remove("fadeOutAnimation");
}

function deleteAlbums(id) {
  while (document.getElementById(id).firstChild) {
    document.getElementById(id).removeChild(document.getElementById(id).firstChild);
  }
}

function buildListenedAlbums() {
  originalListenedOrder = [];
  reverseListenedOrder = [];
  deleteAlbums("albums");
  document.getElementById("albumsHeader").innerHTML = `Listened (${listenedData.length})`;
  for (let i = listenedData.length - 1; i >= 0; i--) {
    // Now create Html Element
    const article = document.createElement("article"),
      showArtistName = document.createElement("p"),
      showAlbumTitle = document.createElement("h4"),
      showAlbumScore = document.createElement("h1"),
      showImg = document.createElement("img");

    // Now put content
    showArtistName.innerHTML = listenedData[i].albumData.artistName;
    showAlbumTitle.innerHTML = listenedData[i].albumData.albumTitle;
    showAlbumScore.innerHTML = listenedData[i].score + "/10";
    showImg.src = listenedData[i].albumData.albumCover;

    const div = document.createElement("div");
    div.appendChild(showAlbumTitle);
    div.appendChild(showArtistName);
    div.appendChild(showAlbumScore);

    article.appendChild(showImg);
    article.appendChild(div);

    article.setAttribute("onclick", `moreInfo('${showArtistName.innerHTML}','${showAlbumTitle.innerHTML}', '${showImg.src}', '${listenedData[i].albumData.releaseDate}', '${listenedData[i].score}', '${listenedData[i].createdAt}', '${listenedData[i].docId}')`);
    article.dataset.artistName = listenedData[i].albumData.artistName;
    article.dataset.releaseDate = listenedData[i].albumData.releaseDate;

    document.getElementById("albums").appendChild(article);
    originalListenedOrder.unshift(article);
    reverseListenedOrder.push(article);
  }
}

function buildWantToListenAlbums() {
  originalListenedOrder = [];
  reverseListenedOrder = [];
  deleteAlbums("albums");
  document.getElementById("albumsHeader").innerHTML = `Want To Listen (${wantToListenData.length})`;
  for (let i = wantToListenData.length - 1; i >= 0; i--) {
    // Now create Html Element
    const article = document.createElement("article"),
      showArtistName = document.createElement("p"),
      showAlbumTitle = document.createElement("h4"),
      showImg = document.createElement("img");

    // Now put content

    showArtistName.innerHTML = wantToListenData[i].albumData.artistName;
    showAlbumTitle.innerHTML = wantToListenData[i].albumData.albumTitle;
    showImg.src = wantToListenData[i].albumData.albumCover;

    const div = document.createElement("div");
    div.appendChild(showAlbumTitle);
    div.appendChild(showArtistName);

    article.appendChild(showImg);
    article.appendChild(div);

    article.setAttribute("onclick", `moreInfo('${showArtistName.innerHTML}','${showAlbumTitle.innerHTML}', '${showImg.src}', '${wantToListenData[i].albumData.releaseDate}', '${wantToListenData[i].score}', '${wantToListenData[i].createdAt}', '${wantToListenData[i].docId}')`);
    article.dataset.artistName = wantToListenData[i].albumData.artistName;
    article.dataset.releaseDate = wantToListenData[i].albumData.releaseDate;

    document.getElementById("albums").appendChild(article);
    originalWantToListenOrder.unshift(article);
    reverseWantToListenOrder.push(article);
  }
}

//!! SEARCHING !!//

async function search() {
  console.log("hello");
  var albumParameters = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + accessToken,
    },
  };

  const songContainer = document.getElementById("songs");
  deleteAlbums("songs");

  var albums = await fetch("https://api.spotify.com/v1/search?q=" + term + "&type=album", albumParameters)
    .then((response) => response.json())
    .then((data) => {
      const artists = data.albums.items;
      return artists.map((result) => {
        // Now create Html Element
        const article = document.createElement("article"),
          artists = document.createElement("p"),
          title = document.createElement("h4"),
          img = document.createElement("img");

        // Now put content

        if (result.artists.length == 1) {
          artists.innerHTML = result.artists[0].name;
        } else {
          stringOfArtists = "";
          for (i = 0; i < result.artists.length; i++) {
            stringOfArtists += result.artists[i].name + " & ";
          }
          artists.innerHTML = stringOfArtists.slice(0, -3);
        }
        title.innerHTML = result.name;
        img.src = result.images[0].url;

        const div = document.createElement("div");
        div.appendChild(title);
        div.appendChild(artists);

        article.appendChild(img);
        article.appendChild(div);

        article.setAttribute("onclick", `popupFunc('${artists.innerHTML}','${title.innerHTML}', '${img.src}', '${result.release_date}')`);

        songContainer.appendChild(article);
      });
    })
    .catch((error) => console.log("Request failed:", error));
}

// search logic
let term = "";
const updateTerm = () => {
  term = document.getElementById("searchTerm").value;
  // check term exist
  if (!term || term === "") {
    alert("Please enter a seach term");
  } else {
    search();
  }
  resetPopup();
};

const searchBtn = document.getElementById("searchTermBtn");
searchBtn.addEventListener("click", updateTerm);
document.getElementById("searchTerm").addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    updateTerm();
  }
});

//!! POPUP !!//

// bring up popup menu and change contents appropriately
function popupFunc(artistName, albumTitle, albumCover, releaseDate) {
  document.getElementById("listenedButton").style.backgroundColor = "#009fb7";
  document.getElementById("uniqueAlbumMessage").style.display = "none";
  deleteAlbums("songs");

  albumsListened = [];
  uniqueListenedAlbum = true;
  for (let i = 0; i < listenedData.length; i++) {
    albumsListened.push(listenedData[i].albumData.albumTitle + listenedData[i].albumData.artistName);
  }
  for (let i = 0; i < albumsListened.length; i++) {
    if (albumTitle + artistName == albumsListened[i]) {
      uniqueListenedAlbum = false;
    }
  }

  albumsWantToListen = [];
  uniqueWantToListenAlbum = true;
  for (let i = 0; i < wantToListenData.length; i++) {
    albumsWantToListen.push(wantToListenData[i].albumData.albumTitle + wantToListenData[i].albumData.artistName);
  }
  for (let i = 0; i < albumsWantToListen.length; i++) {
    if (albumTitle + artistName == albumsWantToListen[i]) {
      uniqueWantToListenAlbum = false;
    }
  }

  // setting up data
  albumData = {
    albumTitle: albumTitle,
    artistName: artistName,
    albumCover: albumCover,
    releaseDate: releaseDate,
  };

  // visualize data in the popup
  document.getElementsByClassName("popup")[0].style.display = "block";
  document.getElementById("popupArtistName").innerHTML = artistName;
  document.getElementById("popupAlbumTitle").innerHTML = albumTitle;
  document.getElementById("popupAlbumCover").src = albumCover;
  document.getElementById("popupReleaseDate").innerHTML = releaseDate.slice(0, 4);

  // gray out album if its in rotation
  if (!uniqueListenedAlbum) {
    document.getElementById("listenedButton").style.backgroundColor = "gray";
    document.getElementById("uniqueAlbumMessage").style.display = "block";
  }

  if (!uniqueWantToListenAlbum) {
    document.getElementById("wantToListenButton").style.backgroundColor = "gray";
    document.getElementById("uniqueAlbumMessage").style.display = "block";
  }
}

///// Firestore /////

const db = firebase.firestore();

const listenedButton = document.getElementById("listenedButton");
const wantToListenButton = document.getElementById("wantToListenButton");
const recommendButton = document.getElementById("recommendButton");
const confirmButton = document.getElementById("confirmButton");

let listenedRef;
let unsubscribe;

auth.onAuthStateChanged((user) => {
  if (user) {
    // Database Reference
    listenedRef = db.collection("listened");
    wantToListenRef = db.collection("wantToListen");

    listenedButton.onclick = () => {
      if (uniqueListenedAlbum) {
        // animation
        listenedButton.classList.add("rollAnimation");
        wantToListenButton.classList.add("rollAnimation");
        recommendButton.classList.add("rollAnimation");
        setTimeout(() => {
          document.getElementById("rating").style.display = "flex";
          document.getElementById("rating").value = "";
          document.getElementById("rating").classList.add("rating");
          confirmButton.style.display = "block";
          document.getElementsByClassName("saveOption")[0].classList.add("submitBar");
          listenedButton.style.display = "none";
          ("¿p´+0");
          wantToListenButton.style.display = "none";
          recommendButton.style.display = "none";
          database = "listened";
        }, 1480);
      }
    };

    wantToListenButton.onclick = () => {
      if (uniqueWantToListenAlbum) {
        listenedButton.classList.add("fadeOutAnimation");
        recommendButton.classList.add("fadeOutAnimation");
        setTimeout(() => {
          listenedButton.style.display = "none";
          recommendButton.style.display = "none";
          wantToListenButton.style.display = "none";
          confirmButton.style.display = "block";
        }, 900);
        database = "wantToListen";
      }
    };

    // add data to database
    confirmButton.onclick = () => {
      const { serverTimestamp } = firebase.firestore.FieldValue;
      if (database == "listened") {
        listenedRef.add({
          albumData,
          score: document.getElementById("rating").value,
          uid: user.uid,
          createdAt: serverTimestamp(),
        });
      } else if (database == "wantToListen") {
        wantToListenRef.add({
          albumData,
          uid: user.uid,
          createdAt: serverTimestamp(),
        });
      }
      resetPopup();
    };

    // tranfer album from wantToListen to listened
    transferButton.onclick = () => {
      transferScore = document.getElementById("transferScoreRange").value / 10;
      const { serverTimestamp } = firebase.firestore.FieldValue;
      // delete from database
      wantToListenRef
        .doc(document.getElementById("moreInfoAlbumTitle").getAttribute("data-docId"))
        .delete()
        .then(() => {
          document.getElementById("deleteButton").style.display = "inherit";
          document.getElementById("transferButton").style.display = "none";
          document.getElementById("moreInfo").style.display = "none";
          document.getElementById("moreInfoBackdrop").style.display = "none";
        })
        .catch((error) => {
          console.error("Error removing document: ", error);
        });
      // add back to database
      listenedRef.add({
        albumData,
        score: transferScore,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
    };

    // delete data from database
    document.getElementById("deleteButton").onclick = () => {
      listenedRef
        .doc(document.getElementById("moreInfoAlbumTitle").getAttribute("data-docId"))
        .delete()
        .then(() => {
          document.getElementById("moreInfo").style.display = "none";
          document.getElementById("moreInfoBackdrop").style.display = "none";
        })
        .catch((error) => {
          console.error("Error removing document: ", error);
        });
      wantToListenRef
        .doc(document.getElementById("moreInfoAlbumTitle").getAttribute("data-docId"))
        .delete()
        .then(() => {
          document.getElementById("moreInfo").style.display = "none";
          document.getElementById("moreInfoBackdrop").style.display = "none";
        })
        .catch((error) => {
          console.error("Error removing document: ", error);
        });
    };

    //change score from listened page
    changeScoreButton.onclick = () => {
      transferScore = document.getElementById("transferScoreRange").value / 10;

      const { serverTimestamp } = firebase.firestore.FieldValue;
      // delete from database
      listenedRef
        .doc(document.getElementById("moreInfoAlbumTitle").getAttribute("data-docId"))
        .delete()
        .then(() => {
          document.getElementById("deleteButton").style.display = "inherit";
          document.getElementById("changeScoreButton").style.display = "none";
          document.getElementById("moreInfo").style.display = "none";
          document.getElementById("moreInfoBackdrop").style.display = "none";
        })
        .catch((error) => {
          console.error("Error removing document: ", error);
        });
      // add back to database
      listenedRef.add({
        albumData,
        score: transferScore,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
    };

    // Query
    unsubscribe = listenedRef
      .where("uid", "==", user.uid)
      .orderBy("createdAt") // Requires a query
      .onSnapshot((querySnapshot) => {
        // Map results to an array
        const data = querySnapshot.docs.map((doc) => {
          docData = doc.data();
          docData.docId = doc.id;
          return docData;
        });
        listenedData = data;
        if (page == "listened") {
          buildListenedAlbums();
        }
      });

    unsubscribe = wantToListenRef
      .where("uid", "==", user.uid)
      .orderBy("createdAt") // Requires a query
      .onSnapshot((querySnapshot) => {
        // Map results to an array
        const data = querySnapshot.docs.map((doc) => {
          docData = doc.data();
          docData.docId = doc.id;
          return docData;
        });
        wantToListenData = data;
        if (page == "wantToListen") {
          buildWantToListenAlbums();
        }
      });
  } else {
    // Unsubscribe when the user signs out
    unsubscribe && unsubscribe();
  }
});

///// FOOTER  CLICK HANDLERS/////
function switchPage(clickedButton) {
  page = clickedButton;
  if (clickedButton == "listened" || clickedButton == "wantToListen") {
    document.getElementById("listened-wantToListen").style.display = "inherit";
    document.getElementById("search").style.display = "none";
    document.getElementById("profile").style.display = "none";
    sortMenuDown = false;
    document.getElementById("sortMenu").style.transform = "translateY(-15vh)";
    document.getElementById("mainListened-wantToListen").style.transform = "translateY(0vh)";
    document.getElementById("moreInfo").style.display = "none";
    document.getElementById("moreInfoBackdrop").style.display = "none";
    if (clickedButton == "listened") {
      buildListenedAlbums();
      document.getElementsByClassName("cd")[1].style.fill = "#099FB7";
      document.getElementsByClassName("folder")[1].style.fill = "#241623";
      document.getElementsByClassName("magnifying-glass")[1].style.fill = "#241623";
      document.getElementById("ratingMenuButton").style.display = "block";
    } else if (clickedButton == "wantToListen") {
      buildWantToListenAlbums();
      document.getElementsByClassName("cd")[1].style.fill = "#241623";
      document.getElementsByClassName("folder")[1].style.fill = "#099FB7";
      document.getElementsByClassName("magnifying-glass")[1].style.fill = "#241623";
      document.getElementById("ratingMenuButton").style.display = "none";
    }
  } else if (clickedButton == "search") {
    document.getElementById("listened-wantToListen").style.display = "none";
    document.getElementById("search").style.display = "inherit";
    document.getElementById("profile").style.display = "none";

    resetPopup();
    deleteAlbums("albums");

    document.getElementsByClassName("cd")[1].style.fill = "#241623";
    document.getElementsByClassName("folder")[1].style.fill = "#241623";
    document.getElementsByClassName("magnifying-glass")[1].style.fill = "#099FB7";
  } else if (clickedButton == "profile") {
    document.getElementById("listened-wantToListen").style.display = "none";
    document.getElementById("search").style.display = "none";
    document.getElementById("profile").style.display = "inherit";
  }
}

// rating input check
const ratingInput = document.getElementById("rating");
// let ratingInputValid = false;
ratingInput.onkeyup = () => {
  if (-1 < ratingInput.value && ratingInput.value <= 10) {
  } else {
    ratingInput.value = "";
  }
};

// show more info on albums in listened or want to listen

function moreInfo(artistName, albumTitle, albumCover, releaseDate, score, createdAt, docId) {
  albumData = {
    albumTitle: albumTitle,
    artistName: artistName,
    albumCover: albumCover,
    releaseDate: releaseDate,
  };

  releaseDate = releaseDate.slice(0, 4);
  document.getElementById("transferButton").style.display = "none";
  document.getElementById("changeScoreButton").style.display = "none";
  document.getElementById("deleteButton").style.display = "inherit";
  document.getElementById("moreInfo").style.display = "block";
  document.getElementById("moreInfoBackdrop").style.display = "block";
  document.getElementById("transferScoreRange").hidden = true;

  document.getElementById("moreInfoAlbumCover").src = albumCover;
  document.getElementById("moreInfoAlbumCover").height = document.getElementById("moreInfoAlbumCover").width;
  document.getElementById("moreInfoAlbumTitle").innerHTML = albumTitle;
  document.getElementById("moreInfoArtistName").innerHTML = artistName;
  document.getElementById("moreInfoReleaseDate").innerHTML = releaseDate;
  if (page == "wantToListen") {
    document.getElementById("moreInfoScore").innerHTML = "Listened?";
    document.getElementById("moreInfoScore").style.color = "#ce8cc0";
    document.getElementById("moreInfoScore").onclick = () => {
      document.getElementById("transferScoreRange").hidden = false;
    };
    document.getElementById("transferScoreRange").oninput = () => {
      if (page == "wantToListen") {
        document.getElementById("transferButton").style.display = "inherit";
        document.getElementById("deleteButton").style.display = "none";
        document.getElementById("moreInfoScore").innerHTML = document.getElementById("transferScoreRange").value / 10 + "/10";
      }
    };
  } else if (page == "listened") {
    document.getElementById("moreInfoScore").innerHTML = score + "/10";
    document.getElementById("moreInfoScore").style.color = "inherit";
    document.getElementById("moreInfoScore").onclick = () => {
      document.getElementById("transferScoreRange").hidden = false;
      document.getElementById("transferScoreRange").value = score * 10;
    };
    document.getElementById("transferScoreRange").oninput = () => {
      if (page == "listened") {
        document.getElementById("changeScoreButton").style.display = "inherit";
        document.getElementById("deleteButton").style.display = "none";
        document.getElementById("moreInfoScore").innerHTML = document.getElementById("transferScoreRange").value / 10 + "/10";
      }
    };
  }
  document.getElementById("moreInfoAlbumTitle").setAttribute("data-docId", docId);
  lastScroll = window.scrollY;
  window.scrollTo(0, 0);
}

document.getElementById("backButton").onclick = () => {
  document.getElementById("deleteButton").style.display = "inherit";
  document.getElementById("transferButton").style.display = "inherit";
  document.getElementById("changeScoreButton").style.display = "inherit";
  document.getElementById("moreInfo").style.display = "none";
  document.getElementById("moreInfoBackdrop").style.display = "none";
  window.scrollTo(0, lastScroll);
};

let sortMenuDown = false;

function hamburgerClick() {
  if (!sortMenuDown) {
    sortMenuDown = true;
    document.getElementById("sortMenu").style.transform = "translateY(0vh)";
    document.getElementById("mainListened-wantToListen").style.transform = "translateY(15vh)";
  } else if (sortMenuDown) {
    sortMenuDown = false;
    document.getElementById("sortMenu").style.transform = "translateY(-15vh)";
    document.getElementById("mainListened-wantToListen").style.transform = "translateY(0vh)";
  }
}

document.getElementById("hamburgerMenu").addEventListener("click", hamburgerClick);

function resetOrder() {
  orderMadeReverse = false;
  titleReverse = false;
  artistReverse = false;
  ratingReverse = false;
  releaseDateReverse = false;
}

resetOrder();

// click order made
document.getElementById("orderMadeMenuButton").onclick = () => {
  if (orderMadeReverse) {
    deleteAlbums("albums");

    if (page == "listened") {
      for (let i = 0; i < reverseListenedOrder.length; i++) {
        document.getElementById("albums").appendChild(reverseListenedOrder[i]);
      }
    } else if (page == "wantToListen") {
      for (let i = 0; i < reverseWantToListenOrder.length; i++) {
        document.getElementById("albums").appendChild(reverseWantToListenOrder[i]);
      }
    }
    resetOrder();
  } else {
    resetOrder();
    deleteAlbums("albums");

    if (page == "listened") {
      for (let i = 0; i < originalListenedOrder.length; i++) {
        document.getElementById("albums").appendChild(originalListenedOrder[i]);
      }
    } else if (page == "wantToListen") {
      for (let i = 0; i < originalWantToListenOrder.length; i++) {
        document.getElementById("albums").appendChild(originalWantToListenOrder[i]);
      }
    }
    orderMadeReverse = true;
  }
};

// click title
document.getElementById("titleMenuButton").onclick = () => {
  if (titleReverse) {
    deleteAlbums("albums");

    reverseAlbums = sortedAlbums.reverse();
    for (let i = 0; i < reverseAlbums.length; i++) {
      document.getElementById("albums").appendChild(reverseAlbums[i]);
    }
    resetOrder();
  } else {
    resetOrder();
    allAlbums = [];
    sortedAlbums = [];
    titles = [];
    sortedTitles = [];
    for (let i = 0; i < document.getElementById("albums").children.length; i++) {
      article = document.createElement("article");
      article.innerHTML = document.getElementById("albums").children[i].innerHTML;
      clickAttribute = document.getElementById("albums").children[i].attributes[0];
      article.setAttribute("onclick", document.getElementById("albums").children[i].attributes[0].value);
      article.dataset.artistName = document.getElementById("albums").children[i].attributes[1].value;
      article.dataset.releaseDate = document.getElementById("albums").children[i].attributes[2].value;
      allAlbums.push(article);
    }
    deleteAlbums("albums");

    for (let i = 0; i < allAlbums.length; i++) {
      title = allAlbums[i].lastChild.firstChild.innerHTML;
      title = title.toLowerCase();
      titles.push(title);
    }
    sortedTitles = titles.sort();
    while (sortedTitles.length > 0) {
      for (let i = 0; i < allAlbums.length; i++) {
        if (allAlbums[i].lastChild.firstChild.innerHTML.toLowerCase() == sortedTitles[0]) {
          sortedAlbums.push(allAlbums[i]);
          sortedTitles.shift();
        }
      }
    }
    for (let i = 0; i < sortedAlbums.length; i++) {
      document.getElementById("albums").appendChild(sortedAlbums[i]);
    }

    titleReverse = true;
  }
};

// click artist
document.getElementById("artistMenuButton").onclick = () => {
  if (artistReverse) {
    deleteAlbums("albums");

    reverseAlbums = sortedAlbums.reverse();
    for (let i = 0; i < reverseAlbums.length; i++) {
      document.getElementById("albums").appendChild(reverseAlbums[i]);
    }
    resetOrder();
  } else {
    resetOrder();
    allAlbums = [];
    sortedAlbums = [];
    artists = [];
    sortedArtists = [];
    for (let i = 0; i < document.getElementById("albums").children.length; i++) {
      article = document.createElement("article");
      article.innerHTML = document.getElementById("albums").children[i].innerHTML;
      clickAttribute = document.getElementById("albums").children[i].attributes[0];
      article.setAttribute("onclick", document.getElementById("albums").children[i].attributes[0].value);
      article.dataset.artistName = document.getElementById("albums").children[i].attributes[1].value;
      article.dataset.releaseDate = document.getElementById("albums").children[i].attributes[2].value;
      allAlbums.push(article);
    }
    deleteAlbums("albums");

    for (let i = 0; i < allAlbums.length; i++) {
      artist = allAlbums[i].dataset.artistName;
      artist = artist.toLowerCase();
      artists.push(artist);
    }
    sortedArtists = artists.sort();
    while (sortedArtists.length > 0) {
      for (let i = 0; i < allAlbums.length; i++) {
        if (allAlbums[i].dataset.artistName.toLowerCase() == sortedArtists[0]) {
          sortedAlbums.push(allAlbums[i]);
          sortedArtists.shift();
        }
      }
    }
    for (let i = 0; i < sortedAlbums.length; i++) {
      document.getElementById("albums").appendChild(sortedAlbums[i]);
    }

    artistReverse = true;
  }
};

// click rating
document.getElementById("ratingMenuButton").onclick = () => {
  if (ratingReverse) {
    deleteAlbums("albums");

    reverseAlbums = sortedAlbums.reverse();
    for (let i = 0; i < reverseAlbums.length; i++) {
      document.getElementById("albums").appendChild(reverseAlbums[i]);
    }
    resetOrder();
  } else {
    resetOrder();
    allAlbums = [];
    sortedAlbums = [];
    ratings = [];
    sortedRatings = [];
    for (let i = 0; i < document.getElementById("albums").children.length; i++) {
      article = document.createElement("article");
      article.innerHTML = document.getElementById("albums").children[i].innerHTML;
      clickAttribute = document.getElementById("albums").children[i].attributes[0];
      article.setAttribute("onclick", document.getElementById("albums").children[i].attributes[0].value);
      article.dataset.artistName = document.getElementById("albums").children[i].attributes[1].value;
      article.dataset.releaseDate = document.getElementById("albums").children[i].attributes[2].value;
      allAlbums.push(article);
    }
    deleteAlbums("albums");

    for (let i = 0; i < allAlbums.length; i++) {
      rating = allAlbums[i].lastChild.lastChild.innerHTML;
      rating = rating.slice(0, -3);
      ratings.push(rating);
    }
    sortedRatings = ratings.sort((a, b) => a - b);
    while (sortedRatings.length > 0) {
      for (let i = 0; i < allAlbums.length; i++) {
        if (allAlbums[i].lastChild.lastChild.innerHTML.slice(0, -3) == sortedRatings[0]) {
          sortedAlbums.push(allAlbums[i]);
          sortedRatings.shift();
        }
      }
    }
    for (let i = 0; i < sortedAlbums.length; i++) {
      document.getElementById("albums").appendChild(sortedAlbums[i]);
    }

    ratingReverse = true;
  }
};

// click releaseDate
document.getElementById("releaseDateMenuButton").onclick = () => {
  if (releaseDateReverse) {
    deleteAlbums("albums");

    reverseAlbums = sortedAlbums.reverse();
    for (let i = 0; i < reverseAlbums.length; i++) {
      document.getElementById("albums").appendChild(reverseAlbums[i]);
    }
    resetOrder();
  } else {
    resetOrder();
    allAlbums = [];
    sortedAlbums = [];
    releaseDates = [];
    sortedReleaseDates = [];
    for (let i = 0; i < document.getElementById("albums").children.length; i++) {
      article = document.createElement("article");
      article.innerHTML = document.getElementById("albums").children[i].innerHTML;
      clickAttribute = document.getElementById("albums").children[i].attributes[0];
      article.setAttribute("onclick", document.getElementById("albums").children[i].attributes[0].value);
      article.dataset.artistName = document.getElementById("albums").children[i].attributes[1].value;
      article.dataset.releaseDate = document.getElementById("albums").children[i].attributes[2].value;
      allAlbums.push(article);
    }
    deleteAlbums("albums");

    for (let i = 0; i < allAlbums.length; i++) {
      releaseDate = allAlbums[i].dataset.releaseDate;
      releaseDate = releaseDate.slice(0, -10).replace("-", "").replace("-", "");
      releaseDates.push(releaseDate);
    }

    sortedReleaseDates = releaseDates.sort((a, b) => a - b);
    while (sortedReleaseDates.length > 0) {
      for (let i = 0; i < allAlbums.length; i++) {
        if (allAlbums[i].dataset.releaseDate.slice(0, -10).replace("-", "").replace("-", "") == sortedReleaseDates[0]) {
          sortedAlbums.push(allAlbums[i]);
          sortedReleaseDates.shift();
        }
      }
    }
    for (let i = 0; i < sortedAlbums.length; i++) {
      document.getElementById("albums").appendChild(sortedAlbums[i]);
    }

    releaseDateReverse = true;
  }
};
