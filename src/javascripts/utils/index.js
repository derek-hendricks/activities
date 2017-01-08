import _ from 'underscore';

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
  }
};

module.exports = Utils;


