var EditModalManager = {
  addTopic: function(self,e) {
    var textEntered = $(this).closest('div').find('input')[0].value,
        $addBtn = $(this),
        topicWellfunction = Handlebars.compile($(self.topicWellTemplate).html()),
        $topicIdsHidden = $(self.topicIds)[0],
        $categories = $(self.categories);
    $.ajax({
      url: '/TopicsRequestHandler',
      data: {requestType: 'checkTopic', checkExist: textEntered  },
      dataType: 'json',
      method: 'post'
    }).done(function(results) {
      if(results.status==='success'){
        var $topicsWell = $(self.topicsWell),
            len = $topicsWell.find('.topics').length;
        
        $topicIdsHidden.value += (($topicIdsHidden.value.length > 0)? ', ':'') + results.topicObj.topicId;
        $categories.html((($categories.html().trim().length > 0)? $categories.html() + ', ' : '') + results.topicObj.category);
        var newWell = $(topicWellfunction([results.topicObj.name])).find('.close').on('click',function(e) {
          self.onTopicWellClose.call(this,self);
        }).end();
        $topicsWell.append(newWell);
        $($topicsWell.find('.topics')[len]).data('topicId',len);
      }
      else {
        $(self.messageArea).html(self.messages['newTopic']).slideDown();
        $(self.newTopicForm).slideDown();
        $addBtn.fadeOut();
        $(self.topicName).attr('disabled',true);
      }
    });
  },
  addCategoryId: function(self) {
    var $addCategoryTxt = $(this).closest('div').find('input')[0],
        textEntered = $addCategoryTxt.value,
        $newTopicForm = $(self.newTopicForm),
        $newCategoryForm = $(self.newCategoryForm),
        $topicIdsHidden = $(self.topicIds)[0],
        $categories = $(self.categories),
        topicWellfunction = Handlebars.compile($(self.topicWellTemplate).html());
    $.ajax({
      url: '/TopicsRequestHandler',
      data: {requestType: 'checkCategory', checkExist: textEntered, newTopicName: $(self.topicName)[0].value },
      dataType: 'json',
      method: 'post'
    }).done(function(results) {
      if(results.status==='success') {
        var $topicsWell = $(self.topicsWell),
            len = $topicsWell.find('.topics').length;

        $topicIdsHidden.value += (($topicIdsHidden.value.length > 0)? ', ':'') + results.topicObj.topicId;
        $categories.html((($categories.html().trim().length > 0)? $categories.html() + ', ' : '') + results.topicObj.category);
        var newWell = $(topicWellfunction([results.topicObj.name])).find('.close').on('click',function(e) {
          self.onTopicWellClose.call(this,self);
        }).end();
        $topicsWell.append(newWell);
        $(self.messageArea).slideUp().removeClass('text-danger');
        $($topicsWell.find('.topics')[len]).data('topicId',len);
        $newTopicForm.slideUp();
        $(self.addTopicId).fadeIn();
        $(self.topicName).attr('disabled',false);
      } else {
      //  console.log($(self.messageArea).removeClass('text-danger'));
        $(self.messageArea).html(self.messages['newCategory']).removeClass('text-danger');
        $($addCategoryTxt).attr('disabled',true);
        $newTopicForm.find(':button').fadeOut();
        $newCategoryForm.slideDown();
        $newCategoryForm.data('topicObj', results.topicObj);
      }
    });
  },
  cancelCategoryIdClicked: function(self,e) {
    $(self.addTopicId).fadeIn();
    $(self.newTopicForm).slideUp();
    $(self.topicName).attr('disabled',false);
    $(self.messageArea).slideUp();
  },
  yesBtnClicked: function(self,e) {

      var $newCategoryForm = $(self.newCategoryForm),
          $newTopicForm = $(self.newTopicForm),
          $topicIdsHidden = $(self.topicIds)[0],
          $categories = $(self.categories),
          $addCategoryTxt = $newTopicForm.find('input')[0],
          topicObj = $newCategoryForm.data('topicObj');

      $.ajax({
        url: '/TopicsRequestHandler',
        data: {requestType: 'addTopicCategory', newTopicObj: topicObj },
        dataType: 'json',
        method: 'post'
      }).done(function(results) {

        if(results.status === 'success') {
          var $topicsWell = $(self.topicsWell),
              len = $topicsWell.find('.topics').length;

          $topicIdsHidden.value += (($topicIdsHidden.value.length > 0)? ', ':'') + results.topicObj.topicId;
          $categories.html((($categories.html().trim().length > 0)? $categories.html() + ', ' : '') + results.topicObj.category);
          var newWell = $(topicWellfunction([results.topicObj.name])).find('.close').on('click',function(e) {
            self.onTopicWellClose.call(this,self);
          }).end();
          $topicsWell.append(newWell);
          $($topicsWell.find('.topics')[len]).data('topicId',len);
          $newCategoryForm.slideUp();
          $newTopicForm.slideUp();
          $(self.messageArea).slideUp();
          $($addCategoryTxt).attr('disabled',false);
          $(self.addTopicId).fadeIn();
          $(self.topicName).attr('disabled',false);
          $newTopicForm.find(':button').fadeIn();
        }
        else {
          $(self.messageArea).html(self.messages['error']).addClass('text-danger');
          $newCategoryForm.slideUp();
          $($addCategoryTxt).attr('disabled',false);
          $newTopicForm.find(':button').fadeIn();
        }
      });
  },
  noBtnClicked: function(self,e) {
      var $newCategoryForm = $(self.newCategoryForm),
          $newTopicForm = $(self.newTopicForm),
          $topicIdsHidden = $(self.topicIds)[0],
          $categories = $(self.categories),
          $addCategoryTxt = $newTopicForm.find('input')[0];

      $newCategoryForm.slideUp();
      $($addCategoryTxt).attr('disabled',false);
      $newTopicForm.find(':button').fadeIn();
      $(self.messageArea).html(self.messages['newTopic']).removeClass('text-danger');
  },
  editQuestionFormSubmit: function(self,e) {
    var $self = $(this),
        $correctIndexinForm = $self.find('input[type="number"]')[0],
        $hiddenTopicIds = $self.find('input[type="hidden"]')[2],
        $textArea = $self.find('textArea'),
        exit = false;

    // On save click
    function isEmpty(val,$this,e) {
      if(val === '') {
        $this.focus();
        e.preventDefault();
        return true;
      }
      return false;
    }
    $textArea.each(function(index) {
      var $this = $(this);
      if(isEmpty($this[0].value,$this,e)) {

        if(index>0) {
          var $selectedTab = $($('.tab')[index-1]);
              $selectedDiv = $selectedTab.closest('div.form-group');

          $selectedTab.click();
          $($selectedDiv.find('textArea')[index-1]).focus();
        }
        exit = true;
      }
    });
    if(exit)
      return;
    if(isEmpty($correctIndexinForm.value,$correctIndexinForm,e))
      return;
    if(isEmpty($hiddenTopicIds.value.replace(/\s/g,''),$(self.topicName),e))
      return;
    $(self.lastEdited)[0].value = self.getCurrentDate();
    e.preventDefault();

    var data = $self.serialize();
    $.ajax({
      url: '/QuestionRequestHandler',
      data: data,
      dataType: 'json',
      method: 'post'
    }).done(function(result) {
      //console.log(result);
      var alertHandleFunction = Handlebars.compile($(self.alertTemplateID).html()),
          $alertArea = $('.alert');
      // Check Alert Area exits
      if($alertArea.length > 0 ) {
        $alertArea.slideUp(500,function(){
          $alertArea.remove();
          $(alertHandleFunction(result)).insertAfter(self.$searchWell).slideDown(500);
        });
      } else {
        $(alertHandleFunction(result)).insertAfter(self.$searchWell).slideDown(500);
      }
    });

    $modal.modal('hide');
    $modal.remove();
    $('body').removeClass('modal-open');
    $('.modal-backdrop').remove();
  }

};
