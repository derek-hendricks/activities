const Utils = {
  formatDate: function (date) {
    var d = new Date(date), month = '' + (d.getMonth() + 1);
    var day = '' + d.getDate(), year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  },

  prioritySort: function (a, b) {
    if (a.priority < b.priority) return -1;
    if (a.priority > b.priority) return 1;
    return 0;
  },

  indexSort: function (a, b) {
    if (a.index < b.index) return -1;
    if (a.index > b.index) return 1;
    return 0;
  },

  lenSort: function (a, b) {
    if (a.length <= b.length && a.index >= b.index) return 1;
    if (a.length >= b.length && a.index <= b.index) return -1;
    return 0;
  },

  setPages: function (activities, cols = 4, page_num = 20) {
    let ref, current = [], pages = [], rows = [];
    rows.push(current);
    for (let i = 0, l = activities.length; i < l; i++) {
      ref = i + 1;
      current.push(activities[i]);
      if (ref % cols === 0 && ref % page_num !== 0) {
        current = [];
        rows.push(current);
      }
      if (ref % page_num === 0 && i !== activities.length - 1) {
        pages.push(rows);
        rows = [];
        current = [];
        rows.push(current);
      }
    }
    if (rows.length) {
      pages.push(rows);
    }
    return pages;
  }
};


export default Utils;


