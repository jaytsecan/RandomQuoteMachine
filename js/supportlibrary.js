function deepFreezeObjects(obj) {
  "use strict";

  // Retrieve the property names defined on obj
  var propNames = Object.getOwnPropertyNames(obj);

  // Freeze properties before freezing self
  propNames.forEach(function (name) {
    var prop = obj[name];

    // Freeze prop if it is an object
    if (typeof prop == 'object' && prop !== null) {
      deepFreezeObjects(prop);
    }
  });

  // Freeze self (no-op if already frozen)
  return Object.freeze(obj);
}

function displayAlert(alertElement, alertType, htmlText, closeFadeout, autoFadeoutDuration) {
  "use strict";

  switch (alertType) {
    case "info":
      {
        alertElement.classList.add("alert-info");
        alertElement.classList.remove("alert-warning", "alert-danger", "alert-success");
        break;
      }
    case "error":
      {
        alertElement.classList.add("alert-danger");
        alertElement.classList.remove("alert-info", "alert-warning", "alert-success");
        break;
      }
    default:
      {
        alertElement.classList.add("alert-info");
        alertElement.classList.remove("alert-warning", "alert-danger", "alert-success");
        break;
      }
  }

  document.getElementById("myAlertMessage").innerHTML = htmlText;
  alertElement.classList.remove("my-alert-hidden", "my-fade-out");


  if (closeFadeout === true) {
    alertElement.classList.add("my-fade-effect");
  } else {
    alertElement.classList.remove("my-fade-effect");
  }

  // autoFadeout not yet implemented
  if (autoFadeoutDuration > 0) {}
}

function fadeOutAlert(alertElement) {
  "use strict";
  alertElement.classList.add("my-fade-out");
}

function hideAlert(alertElement) {
  "use strict";
  alertElement.classList.add("my-alert-hidden");
}
