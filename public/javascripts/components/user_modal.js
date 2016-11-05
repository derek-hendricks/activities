define([
  'knockout',
], function(ko) {

  const UserComponent = {
    vm: function (params) {
      var self = this;
    },

    template: '\
      <div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">\
        <div class="modal-dialog" role="document">\
          <div class="modal-content">\
            <div class="modal-header">\
              <div class="row">\
                <div class="col-md-6">\
                  <h4 class="modal-title" data-bind="text: activity" id="myModalLabel"></h4>\
                </div>\
                <div class="col-md-6">\
                  <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
                </div>\
              </div>\
            </div>\
            <div class="modal-body">\
            <div class="row">\
                <div class="col-md-3">\
                  <p>Activity Date:</p>\
                </div>\
                <div class="col-md-3">\
                  <p data-bind="text: activity_date"></p>\
                </div>\
              </div>\
              <div class="row">\
                <div class="col-md-3"><p>Organizer:</p></div>\
                <div class="col-md-3">\
                  <a data-bind="click: viewUserProfile">\
                    <p data-bind="text: organizer_email"></p>\
                  </a>\
                </div>\
                <div class="col-md-3"></div>\
              </div>\
              <div class="row">\
                <div class="col-md-3">\
                  <p>Participants:</p>\
                </div>\
                <div class="col-md-3">\
                  <p data-bind="text: participants"></p>\
                </div>\
              </div>\
              <div class="row">\
                <div class="col-md-3"><p>Description:</p></div>\
                <div class="col-md-8 description">\
                  <p data-bind="text: description"></p>\
                </div>\
              </div><br/><br/>\
              <div class="row">\
                <div class="col-md-3">\
                </div>\
              </div>\
            </div>\
            <div class="modal-footer">\
              <div class="row">\
                <div class="col-md-4 remove-activity">\
                  <button data-bind="click: removeActivity" type="button" class="btn btn-default" data-dismiss="modal">Remove Activity</button>\
                </div>\
                <div class="col-md-8">\
                  <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>\
                  <button data-bind="click: editActivity" type="button" class="btn btn-primary">Edit Activity</button>\
                </div>\
              </div>\
            </div>\
          </div>\
        </div>\
      </div>\
    '
  }
  return UserComponent;
});



