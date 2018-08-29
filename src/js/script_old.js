// Load locales
var gdprCookieNoticeLocales = {};

function gdprCookieNotice(config) {
  var namespace = 'gdprcookienotice';
  var pluginPrefix = 'gdpr-cookie-notice';
  var templates = window[pluginPrefix+'-templates'];
  var gdprCookies = Cookies.noConflict();
  var modalLoaded = false;
  var noticeLoaded = false;
  var cookiesAccepted = false;
  var defaultChecked = false;
  var categories = [];//['performance', 'analytics', 'marketing'];
  if(config.performance != false && config.performance.length) {
    categories.push('performance');
  }
  if(config.analytics != false && config.analytics.length) {
    categories.push('analytics');
    //categories['analytics'] = config.analytics;
  }
  if(config.marketing != false && config.marketing.length) {
    categories.push('marketing');
  //  categories['marketing'] = config.marketing;
  }
  if(config.defaultChecked) {
    defaultChecked = true;
  }

  // Default config options
  if(!config.locale) config.locale = 'en';
  if(!config.timeout) config.timeout = 500;
  if(!config.domain) config.domain = window.location.hostname;
  if(!config.expiration) config.expiration = 30;

  // Get the users current cookie selection
  var currentCookieSelection = getCookie();
  var cookiesAcceptedEvent = new CustomEvent('gdprCookiesEnabled', {detail: currentCookieSelection});

  // Show cookie bar if needed
  if(!currentCookieSelection) {
    showNotice();

    // Accept cookies on page scroll
    if(config.implicit) {
      acceptOnScroll();
    }
  } else {
    deleteCookies(currentCookieSelection);
    document.dispatchEvent(cookiesAcceptedEvent);
  }

  // Get gdpr cookie notice stored value
  function getCookie() {
    return gdprCookies.getJSON(namespace);
  }

  // Delete cookies if needed
  function deleteCookies(savedCookies) {
    var notAllEnabled = false;
    for (var i = 0; i < categories.length; i++) {
      if(config[categories[i]] && !savedCookies[categories[i]]) {
        for (var ii = 0; ii < config[categories[i]].length; ii++) {
          gdprCookies.remove(config[categories[i]][ii]);
          notAllEnabled = true;
        }
      }
    }
    if(!savedCookies && !gdprCookies) {
      showNotice();
    } else {
      hideNotice();
    }

    // Show the notice if not all categories are enabled
/*    if(notAllEnabled) {
      showNotice();
    } else {
      hideNotice();
    }*/
  }

  // Hide cookie notice bar
  function hideNotice() {
    document.documentElement.classList.remove(pluginPrefix+'-loaded');
  }

  // Write gdpr cookie notice's cookies when user accepts cookies
  function acceptCookies(save) {
    var value = {
      date: new Date(),
      necessary: true,
    };
    categories.forEach(function(cat) {
      value[cat] = true;
    });
    // If request was coming from the modal, check for the settings
    if(save) {
      for (var i = 0; i < categories.length; i++) {
        value[categories[i]] = document.getElementById(pluginPrefix+'-cookie_'+categories[i]).checked;
      }
    }
    gdprCookies.set(namespace, value, { expires: config.expiration, domain: config.domain });
    deleteCookies(value);

    // Load marketing scripts that only works when cookies are accepted
    cookiesAcceptedEvent = new CustomEvent('gdprCookiesEnabled', {detail: value});
    document.dispatchEvent(cookiesAcceptedEvent);

  }

  // Show the cookie bar
  function buildNotice() {
    if(noticeLoaded) {
      return false;
    }

    var noticeHtml = localizeTemplate('bar.html', null);
    document.body.insertAdjacentHTML('beforeend', noticeHtml);

    // Load click functions
    setNoticeEventListeners();

    // Make sure its only loaded once
    noticeLoaded = true;
  }

  // Show the cookie notice
  function showNotice() {
    buildNotice();

    // Show the notice with a little timeout
    setTimeout(function(){
      document.documentElement.classList.add(pluginPrefix+'-loaded');
    }, config.timeout);
  }

  // Localize templates
  function localizeTemplate(template, prefix) {
    var str = templates[template];
    var data = gdprCookieNoticeLocales[config.locale];

    if(prefix) {
      prefix = prefix+'_';
    } else {
      prefix = '';
    }

    if (typeof str === 'string' && (data instanceof Object)) {
      for (var key in data) {
        return str.replace(/({([^}]+)})/g, function(i) {
          var key = i.replace(/{/, '').replace(/}/, '');

          if(key == 'prefix') {
            return prefix.slice(0, -1);
          }

          if(data[key]) {
            return data[key];
          } else if(data[prefix+key]) {
            return data[prefix+key];
          } else {
            return i;
          }
        });
      }
    } else {
      return false;
    }
  }

  // Build modal window
  function buildModal() {
    if(modalLoaded) {
      return false;
    }

    // Load modal template
    var modalHtml = localizeTemplate('modal.html', null);

    // Append modal into body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Get empty category list
    var categoryList = document.querySelector('.'+pluginPrefix+'-modal-cookies');

    //Load essential cookies
    categoryList.innerHTML += localizeTemplate('category.html', 'cookie_essential');
    var input = document.querySelector('.'+pluginPrefix+'-modal-cookie-input');
    var label = document.querySelector('.'+pluginPrefix+'-modal-cookie-input-switch');
    label.innerHTML = gdprCookieNoticeLocales[config.locale]['always_on'];
    label.classList.add(pluginPrefix+'-modal-cookie-state');
    //label.classList.remove(pluginPrefix+'-modal-cookie-input-switch');
    input.remove();

    // Load other categories if needed
    if(config.performance) categoryList.innerHTML += localizeTemplate('category.html', 'cookie_performance');
    if(config.analytics) categoryList.innerHTML += localizeTemplate('category.html', 'cookie_analytics');
    if(config.marketing) categoryList.innerHTML += localizeTemplate('category.html', 'cookie_marketing');

    // Load click functions
    setModalEventListeners();

    // Update checkboxes based on stored info(if any)
    if(currentCookieSelection) {
      if(config.performance) document.getElementById(pluginPrefix+'-cookie_performance').checked = currentCookieSelection.performance;
      if(config.analytics) document.getElementById(pluginPrefix+'-cookie_analytics').checked = currentCookieSelection.analytics;
      if(config.marketing) document.getElementById(pluginPrefix+'-cookie_marketing').checked = currentCookieSelection.marketing;
    } else {
      if(config.performance) document.getElementById(pluginPrefix+'-cookie_performance').checked = config.defaultChecked;
      if(config.analytics) document.getElementById(pluginPrefix+'-cookie_analytics').checked = config.defaultChecked;
      if(config.marketing) document.getElementById(pluginPrefix+'-cookie_marketing').checked = config.defaultChecked;
    }

    // Make sure modal is only loaded once
    modalLoaded = true;
  }

  // Show modal window
  function showModal() {
    buildModal();
    document.documentElement.classList.add(pluginPrefix+'-show-modal');
  }

  // Hide modal window
  function hideModal() {
    document.documentElement.classList.remove(pluginPrefix+'-show-modal');
  }

  // Click functions in the notice
  function setNoticeEventListeners() {
    var settingsButton = document.querySelectorAll('.'+pluginPrefix+'-nav-item-settings')[0];
    var acceptButton = document.querySelectorAll('.'+pluginPrefix+'-nav-item-accept')[0];

    settingsButton.addEventListener('click', function(e) {
      e.preventDefault();
      showModal();
    });

    acceptButton.addEventListener('click', function(e) {
      e.preventDefault();
      acceptCookies();
    });

  }

  // Click functions in the modal
  function setModalEventListeners() {
    var closeButton = document.querySelectorAll('.'+pluginPrefix+'-modal-close')[0];
    var statementButton = document.querySelectorAll('.'+pluginPrefix+'-modal-footer-item-statement')[0];
    var categoryTitles = document.querySelectorAll('.'+pluginPrefix+'-modal-cookie-title');
    var saveButton = document.querySelectorAll('.'+pluginPrefix+'-modal-footer-item-save')[0];

    closeButton.addEventListener('click', function() {
      hideModal();
      return false;
    });

    statementButton.addEventListener('click', function(e) {
      e.preventDefault();
      window.open(
        config.statement,
        '_blank'
      );
      //window.location.href = config.statement;
    });

    for (var i = 0; i < categoryTitles.length; i++) {
      categoryTitles[i].addEventListener('click', function() {
        this.parentNode.parentNode.classList.toggle('open');
        return false;
      });
    }

    saveButton.addEventListener('click', function(e) {
      e.preventDefault();
      saveButton.classList.add('saved');
      setTimeout(function(){
        saveButton.classList.remove('saved');
      }, 1000);
      acceptCookies(true);
      setTimeout(function(){
        hideModal();
      }, 1000);
    });

  }

  // Settings button on the page somewhere
  var globalSettingsButton = document.querySelectorAll('.'+pluginPrefix+'-settings-button');
  if(globalSettingsButton) {
    for (var i = 0; i < globalSettingsButton.length; i++) {
      globalSettingsButton[i].addEventListener('click', function(e) {
        e.preventDefault();
        showModal();
      });
    }
  }


  // Get document height
  function getDocHeight() {
    var D = document;
    return Math.max(
      D.body.scrollHeight, D.documentElement.scrollHeight,
      D.body.offsetHeight, D.documentElement.offsetHeight,
      D.body.clientHeight, D.documentElement.clientHeight
    );
  }

  // Check if at least page is 25% scrolled down
  function amountScrolled(){
    var winheight= window.innerHeight || (document.documentElement || document.body).clientHeight;
    var docheight = getDocHeight();
    var scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;
    var trackLength = docheight - winheight;
    var pctScrolled = Math.floor(scrollTop/trackLength * 100); // gets percentage scrolled (ie: 80 or NaN if tracklength == 0)
    if(pctScrolled > 25 && !cookiesAccepted) {
      cookiesAccepted = true;
      return true;
    } else {
      return false;
    }
  }

  // Accept cookies on scroll
  function acceptOnScroll() {
    window.addEventListener('scroll', function _listener() {
      if(amountScrolled()) {
        acceptCookies();
        window.removeEventListener('click', _listener);
      }
    });
  }

}