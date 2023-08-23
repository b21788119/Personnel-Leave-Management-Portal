import Swal from 'sweetalert2'

// Since a different version of the jQuery is used for datepicker function,preventing conflicts here.
$.noConflict();

var modal_clone;  // Global variable to restore the state of the modals after user interacts them.

// Constant structure to be used in the validation modals of the sweetalert.
const swalWithBootstrapButtons = Swal.mixin({
  customClass: {
    confirmButton: 'btn btn-success',
    cancelButton: 'btn btn-danger cancel'
  },
  buttonsStyling: false
});


jQuery(document).ready(function () {
  // Everytime the script is inserted to the page,logout function is activated here.
  logout();
  if(window.location.href.endsWith("/panel")){
    // Enabling necessary functions to be used in the panel page.
    filterPersonnelByDepartment();
    activateSearch();
  }
  else if(window.location.href.includes("leaveManagement/")){
    // Enabling necessary functions to be used in the leave management page.
    filterLeaves();
    addLeave();
  }

;
});

function addLeave(){
  jQuery("#btn_add").on("click",async function (){
    const form = serializeForm("new_leave_form"); // Serializing the leave entry form.
    const control = checkLeaveEntry(form);  // Validating the provided data.
    if (typeof control == "string") {
        // If there is an invalid field in the form, returning feedback to the user.
        jQuery("#feedback_text").text(`${control}`);
        jQuery("#feedback_text").css("color", "red");
        jQuery("#feedback_text").css("display", "block");
        return;
      } else {
        var total_days = control;
        form.total_days = total_days;
        let currentPersonnelStatus = jQuery("#personnel_status").text();
        // If the form fields are valid, sending the form to the server.
        let data = await sendRequest(form,window.location.href+"/add");
        if(data.status === "success"){
          // Adding the response variables to the form
          form.leave_status = data.leave_status;
          form.id_leave = data.increment_value;
        }
        else{
          return;
        }
        // Deciding the new status of the personnel
        const updatedPersonnelStatus = (form.leave_status === "Active" ? "On Leave" : currentPersonnelStatus);
        // Updating the fields of the personnel table
        updatePersonnelData(parseFloat(jQuery("#leave_left").text())-total_days,parseFloat(jQuery("#total_leave_used").text())+total_days,updatedPersonnelStatus);
        // Creating new table row to insert at the top of the leave table of the personnel
        let tableRow = createLeaveTableRow(form.id_leave,form.leave_status ,`${form.start} ${form.hour}`,`${form.end} ${form.hour2}`,form.total_days,form.id_personnel,updatedPersonnelStatus);
        // Creating a modal for the new leave
        let modal = createLeaveUpdateModal(form);
        // Adding the newly created components to the page
        jQuery("#leave_table").prepend(tableRow);
        jQuery("#card_body").prepend(modal);
        jQuery(`#feedback_text`).css("display", "none");
        // Giving feedback to the user by using the sweetalert
        Swal.fire({
          title: 'Leave Has Successfully Registered',
          html: `<p style="text-align: center">Personnel : ${jQuery("#personnel_name").text()} ${jQuery("#personnel_surname").text()}<br>Start Date : ${form.start} ${form.hour}<br>End Date : ${form.end} ${form.hour2}`,
          confirmButtonText: 'OK',
          icon: 'success'
        });

        // If the personnel has no annual leave left, removing the leave entry form from the page.
        if(parseFloat(jQuery("#leave_left").text()) < 0.5){
          jQuery("#new_leave_form").replaceWith(`<p id="info-leave"> The personnel has no annual leave left.</p>`);
        }

      }
  });
}
function updatePersonnelData(leave_left,leave_used,personnel_status){

  // Updating the table data on the personnel page.
  jQuery("#leave_left").text(leave_left);
  jQuery("#total_leave_used").text(leave_used);
  jQuery("#personnel_status").text(personnel_status);

}

function createLeaveTableRow(leaveID,leaveStatus,startDate,endDate,totalDays,personnelID,personnelStatus){

  // Creating new row with the provided arguments to insert it to the leave table of the personnel
  var row = `<tr id="leave_row_${leaveID}" class="${leaveStatus.toLowerCase()}-row">
                                    <td id="start_column_${leaveID}" class="control-start" style="vertical-align: middle">${ startDate }</td>
                                    <td id="end_column_${leaveID}"  class="control-end" style="vertical-align: middle">${ endDate }</td>
                                    <td id="status_column_${leaveID}" style="vertical-align: middle">${leaveStatus}</td>
                                     <td style="text-align: center;vertical-align: middle">
                                        <button id="modal_open_${leaveID}" type="button" class="btn btn-outline-success btn-sm modal-open" data-toggle="modal"
                                                data-target="#modal-for-${leaveID}" onclick="window.cloneModal(${leaveID})"> Update
                                        </button>

                                    </td>
                                    <td>
                                        <form action="leave_management.html" id="form_delete_${leaveID}">
                                          <input type="hidden"  name="total_days" value="${totalDays}">
                                          <input type="hidden"  name="id_leave" value="${leaveID}">
                                           <input type="hidden"  name="id_personnel" value="${personnelID}">
                                           <input type="hidden"  name="personnel_status" value="${personnelStatus}">
                                           <input type="hidden"  name="operation" value="Delete">
                                        </form>
                                        <button id ="btn_delete_${leaveID}" type="button" class="btn btn-outline-danger btn-sm btn-leave-submit" onclick="window.deleteLeave(${leaveID},'${leaveStatus}')">
                                        Delete
                                        </button>

                                    </td>
                          
                                 </tr>`;
  return row;
}

function createLeaveUpdateModal(form){
  // After leave entry and leave update,creating new modal for the leave
  var modal = "";

  // Form is not inserted into the modal if the leave is completed.
  if(form.leave_status == "Completed"){
    modal = `<div class="modal fade" id="modal-for-${form.id_leave}" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true" style="display: none;">
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLongTitle">Update Leave</h5>
                </div>
                <div class="modal-body">

                        Completed Leaves Can Not Be Updated.

                </div>
                <div class="modal-footer">
                    <button id="btn_close_${form.id_leave}" type="button" class="btn btn-secondary modal-close-btn" data-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>`

  }
  else {
    // If the status of the leave is not completed,creating control variables and the modal
    let modalControlVariables = createModalControlVariables(form);
    modal =
            `<div class="modal fade" id="modal-for-${form.id_leave}" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" style="display:none;">
                <div class="modal-dialog modal-dialog-centered" role="document">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="exampleModalLongTitle">Update Leave</h5>
                        </div>
                        <div class="modal-body">
                              <form id="update_form_${form.id_leave}">
                                      <div class="form-row">
                                        <div class="col form-group">
                                            <label for="modal_datepicker-${form.id_leave}-1">Start Date: </label>
                                            <div id="modal_datepicker-${form.id_leave}-1" class="input-group date modal_picker_start" data-date-format="dd/mm/yyyy">
                                                    <input id="update_start_${form.id_leave}" name="start" class="form-control" type="text" value="${form.start}" readonly="" ` + `${modalControlVariables[0]}` + `>
                                                      <span class="input-group-addon"></span>

                                            </div>
                                        </div>
                                        <div class="col form-group">
                                            <label for="modal_datepicker-${form.id_leave}-2">End Date: </label>
                                            <div id="modal_datepicker-${form.id_leave}-2" class="input-group date modal_picker_end" data-date-format="dd/mm/yyyy">
                                                <input id="update_end_${form.id_leave}" name="end" class="form-control" type="text" value="${form.end}" readonly="">
                                                <span class="input-group-addon"></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="col form-group">
                                            <div class="form-check">
                                                        <input class="form-check-input" type="radio" name="hour" value="09:00" id="start_radio_morning_update_${form.id_leave}"`+` ${modalControlVariables[1]}`+ ` ${modalControlVariables[2]}`+`>

                                                        <label class="form-check-label" for="hour">
                                                            Morning
                                                        </label>
                                            </div>
                                            <div class="form-check">
                                                        <input class="form-check-input" type="radio" name="hour" value="13:00" id="start_radio_afternoon_update_${form.id_leave}"` +` ${modalControlVariables[3]} `+  `${modalControlVariables[4]}` +`>



                                                <label class="form-check-label" for="hour">
                                                    Afternoon
                                                </label>
                                            </div>
                                        </div>
                                        <div class="col form-group">
                                            <div class="form-check">

                                                        <input class="form-check-input" type="radio" name="hour2" value="09:00" id="end_radio_morning_update_${form.id_leave}"` + ` ${modalControlVariables[5]} ` + `>


                                                <label class="form-check-label" for="hour2">
                                                Morning
                                                
                                                </label>
                                            </div>
                                            <div class="form-check">

                                                        <input class="form-check-input" type="radio" name="hour2" value="13:00" id="end_radio_afternoon_update_${form.id_leave}"`+ ` ${modalControlVariables[6]} `+ `>

                                                <label class="form-check-label" for="hour2">
                                                    Afternoon
                                                </label>
                                            </div>
                                        </div>

                                    </div>

                                   <input type="hidden"  name="operation" value="Update">
                                   <input type="hidden"  name="id_leave" value="${form.id_leave}">
                                   <input type="hidden"  name="id_personnel" value="${form.id_personnel}">
                                   <input type="hidden"  name="leave_status" value="${form.leave_status}">
                                   <input type="hidden"  name="total_days" value="${form.total_days}">
                                   <p id="feedback_text_${form.id_leave}" class="form-text" style="display: none"></p>
                              </form>
            </div>
            <div class="modal-footer new-footer">
               <button id="btn_close_${form.id_leave}" type="button" class="btn btn-secondary modal-close-btn" data-dismiss="modal" onclick="window.replaceWithClone(${form.id_leave})">Close</button>
               <button id="btn_update_${form.id_leave}"  type="button" class="btn btn-primary btn-leave-submit" onclick="window.updateLeave(${form.id_leave})">Save</button>
            </div>
        </div>
     </div>
    </div>`;
  }
  return modal;
}

function createModalControlVariables(form){
  // Creating control variables to successfully create a new modal according to the fields of the form.
  var modal_control_variables = [];

  // Checking the value of the radio buttons of the provided form.
  modal_control_variables[1] = (form.hour.startsWith("09")) ? "checked" : "";
  modal_control_variables[3] = (modal_control_variables[1] === "checked") ? "" : "checked";
  modal_control_variables[5] = (form.hour2.startsWith("09")) ? "checked" : "";
  modal_control_variables[6] = (modal_control_variables[5] === "checked") ? "" : "checked";

  // Checking the leave status to decide which fields in the modal must be disabled
  if (form.leave_status === "Active") {
      modal_control_variables[0] = "disabled";
      modal_control_variables[2] = "disabled";
      modal_control_variables[4] = "disabled";

  } else if (form.leave_status === "Unstarted") {
    modal_control_variables[0] = "";
    modal_control_variables[2] = "";
    modal_control_variables[4] = "";

  }

  return modal_control_variables;

}


window.cloneModal = function (leaveID) {
  // Cloning a modal to restore its state when user interacts with the modal and then close it
  const formClone = serializeForm(`update_form_${leaveID}`);
  if(formClone.leave_status === "Active"){
        formClone.start = jQuery(`#update_start_${leaveID}`).val();
        formClone.hour =  jQuery(`#start_radio_morning_update_${leaveID}`).prop("checked") ? "09:00" : "13:00";
  }
  modal_clone= createLeaveUpdateModal(formClone);
}


window.replaceWithClone = function(leaveID){
  // Restoring the state of the modal using the clone
  jQuery(`#modal-for-${leaveID}`).replaceWith(modal_clone);

}


window.updateLeave = async function(leaveID){
  // Serializing the update form.
  const updateForm = serializeForm(`update_form_${leaveID}`);

  // Checking if the current leave's status is active or not to restore missing form fields.
  if(updateForm.leave_status === "Active"){
    updateForm.start = jQuery(`#update_start_${leaveID}`).val();
    updateForm.hour = (jQuery(`#start_radio_morning_update_${leaveID}`).prop("checked") ? "09:00" : "13:00");
  }

  // Validating the fields of the form.
  const control = checkLeaveEntry(updateForm);

  if (typeof control == "string") {
        // If the form has any invalid fields,returning feedback to the user
        jQuery(`#feedback_text_${leaveID}`).text(`${control}`);
        jQuery(`#feedback_text_${leaveID}`).css("color", "red");
        jQuery(`#feedback_text_${leaveID}`).css("display", "block");
        return;
      } else {
    updateForm.total_day_request = control;
    let currentPersonnelStatus = jQuery("#personnel_status").text();
    // If form is validated,sending it to the server
    let data = await sendRequest(updateForm,window.location.href+`/update/${leaveID}`);

    if(data.status === "success"){
      let updatedPersonnelStatus;
      // Deciding the new status of the personnel after update operation
      if(data.leave_status === "Active"){
        updatedPersonnelStatus = "On Leave";
      }
      else if(updateForm.leave_status === "Active" && data.leave_status === "Completed"){
        updatedPersonnelStatus = "Currently Working";
      }
      else if(updateForm.leave_status === "Unstarted" && data.leave_status === "Completed"){
        updatedPersonnelStatus = currentPersonnelStatus;
      }
      updateForm.leave_status = data.leave_status;
      // Updating the data on the personnel table
      const currentLeaveLeft = parseFloat(jQuery("#leave_left").text());
      updatePersonnelData(currentLeaveLeft + parseFloat(updateForm.total_days) - updateForm.total_day_request,parseFloat(jQuery("#total_leave_used").text())- parseFloat(updateForm.total_days) + updateForm.total_day_request,updatedPersonnelStatus);
      updateForm.total_days = control;
      // Creating new row for the updated leave
      let tableRow = createLeaveTableRow(updateForm.id_leave,updateForm.leave_status ,`${updateForm.start} ${updateForm.hour}`,`${updateForm.end} ${updateForm.hour2}`,updateForm.total_days,updateForm.id_personnel,updatedPersonnelStatus);
      // Creating new modal for the updated leave
      let modal = createLeaveUpdateModal(updateForm);
      // Replacing the old components with the newly created components
      jQuery(`#leave_row_${updateForm.id_leave}`).replaceWith(tableRow);
      window.$(`#modal-for-${updateForm.id_leave}`).modal('hide');
      jQuery(`#modal-for-${updateForm.id_leave}`).replaceWith(modal);
      // Returning feedback to the user using the sweetalert
      await Swal.fire({
          title: 'The Leave Has Been Successfully Updated!',
          confirmButtonText: 'OK',
          icon: 'success'
      });
      // Reloading the page if the annual leave status of the personnel is changed
      const updatedLeaveLeft = parseFloat(jQuery("#leave_left").text());
      if(updatedLeaveLeft < 0.5 || (currentLeaveLeft == 0.0 && updatedLeaveLeft > 0.0)){
          await setTimeout({},500);
          location.reload();
      }

    }
    else{
      return;
    }

  }
}

window.deleteLeave = async function (leaveID,leaveStatus){
  // Preventing user from deletion of the active and completed leaves
  if(leaveStatus !== "Unstarted"){
    await Swal.fire({
            title: 'You Are Not Authorized To Delete This Permission!',
            confirmButtonText: 'OK',
            icon: 'error'
    });
  }
  else{
    // Validating the deletion request using the sweetalert
    swalWithBootstrapButtons.fire({
      title: 'Are You Sure?',
      text: "This Operation Is Not Reversible",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Close',
      reverseButtons: true
    }).then(async (result) => {
          if (result.isConfirmed) {
            // If user confirm the operation,serializing the deletion form
            const deleteForm = serializeForm(`form_delete_${leaveID}`);
            // Sending request to the server
            const response = await sendRequest(deleteForm,window.location.href+`/delete/${leaveID}`);
            if (response.status !== "success") {
              return;
            }
            // Returning feedback to the user
            await Swal.fire({
              title: 'The Leave Has Been Successfully Deleted',
              confirmButtonText: 'OK',
              icon: 'success'
            });
            const currentLeaveLeft = parseFloat(jQuery("#leave_left").text());
            // Updating the fields of the personnel table
            updatePersonnelData(currentLeaveLeft + parseFloat(deleteForm.total_days),parseFloat(jQuery("#total_leave_used").text()) - parseFloat(deleteForm.total_days),jQuery("#personnel_status").text());
            // Hiding the deleted leave row dynamically
            jQuery(`#leave_row_${leaveID}`).hide(1000);
            // Changing class attributes of some elements to prevent them to be included in the future overlap controls
            jQuery(`#leave_row_${leaveID}`).attr("class", "deleted");
            jQuery(`#start_column_${leaveID}`).attr("class","deleted");
            jQuery(`#end_column_${leaveID}`).attr("class","deleted");
            const updatedLeaveLeft = parseFloat(jQuery("#leave_left").text());

            // If total annual leave status of the personnel changes,reloading the page here
            if(currentLeaveLeft == 0.0 && updatedLeaveLeft > 0.0){
              location.reload();
            }
          } else{
            Swal.close();
          }
        });

  }
}


function filterLeaves(){
  // When the value of the select element on the leave table page changes, hiding unselected rows
  jQuery("#select_type").on("change",(function(){
    var option = jQuery("#select_type").val();
    if(option=="Active"){
      jQuery(".active-row").css("display","");
      jQuery(".completed-row").css("display","NONE");
      jQuery(".unstarted-row").css("display","NONE");
    }
    else if(option=="Completed"){
      jQuery(".completed-row").css("display","");
      jQuery(".active-row").css("display","NONE");
      jQuery(".unstarted-row").css("display","NONE");
    }
    else if(option=="Unstarted"){
      jQuery(".unstarted-row").css("display","");
      jQuery(".active-row").css("display","NONE");
      jQuery(".completed-row").css("display","NONE");
    }
    else if(option=="All"){
      jQuery(".unstarted-row").css("display","");
      jQuery(".active-row").css("display","");
      jQuery(".completed-row").css("display","");
    }
  }));

}

function filterPersonnelByDepartment(){
  // Filtering the personnel according to the department value of the select element located on panel page
   jQuery("#department-filter").on("change",(function(){
     var department = jQuery("#department-filter").val().toLowerCase();
     if(department != "all"){
        jQuery("#personnel_list_table .list").filter(function() {
          jQuery(this).toggle(jQuery(this).text().toLowerCase().indexOf(department) > -1);
    });
     }
     else {
       jQuery("#personnel_list_table .list").show();
     }
   }));
}


function checkLeaveEntry(form){
  let today =  new Date(new Date().toDateString()).getTime();
  // Calculating the total time of the start date without hour information
  let startDateWithoutHours = calculateTime(form.start,false,0);
  // Calculating the total time of the start date with hour information
  let startDateWithHours = calculateTime(form.start,(form.hour==="09:00"),1);
  // Calculating the total time of the end date without hour information
  let endDateWithoutHours = calculateTime(form.end,false,0);
  // Calculating the total time of the end date with hour information
  let endDateWithHours = calculateTime(form.end,(form.hour2 === "09:00"),1);
  // Getting the leave information from the personnel table
  let leaveLeft = parseFloat(jQuery("#leave_left").text());


  // Checking the validity of the start date if the operation is add
  if(form.operation === "Add" || form.leave_status != "Active"){
    if(startDateWithoutHours < today){
      return "Leave Start Can Not Belong to Past Dates.";
  }

  }
  // Checking the validity of the end date
  if((endDateWithHours-startDateWithHours) <= 0 || endDateWithoutHours < today){
    return "End Date of the Leave Is Invalid.";
  }

  // Calculating the requested number of days
  var numberOfDays = (((endDateWithHours - startDateWithHours)/ (1000.0 * 3600 * 24))).toFixed(1).toString();

  // Formatting number of days to deal with the half day leave requests
  numberOfDays = parseFloat(numberOfDays.split(".")[1] != "0" ?  numberOfDays.split(".")[0] + ".5" : numberOfDays).toFixed(1);

  // Checking if the total leave left is enough for new request
  if(form.operation === "Update" && (numberOfDays - form.total_days) > leaveLeft ){
    return "Annual Leave Is Not Enough."
  }
  else if(form.operation === "Add" && (numberOfDays > leaveLeft)){
    return "Annual Leave Is Not Enough."
  }

  // Checking if the requested leave overlaps with the existing personnel leaves
  var overlapping_control = false;

  // Fetching the leaves of the personnel for control operation
  var active_starts = jQuery( ".control-start" );
  var active_ends = jQuery( ".control-end" );

  // Looping through the personnel leaves to check if overlap exists
  for (let i = 0; i < active_starts.length; i++) {
      // Preventing the self overlap when the operation is update
      if(form.operation === "Update" && active_starts[i].id.split("_")[2] == form.id_leave){
        continue;
      }
      var active_start_total = calculateTime(active_starts[i].textContent.split(" ")[0],active_starts[i].textContent.split(" ")[1].startsWith("09") ? true:false,1);
      var active_end_total  =  calculateTime(active_ends[i].textContent.split(" ")[0],active_ends[i].textContent.split(" ")[1].startsWith("09") ? true:false,1);
      // Controlling the overlaps
      var control = (startDateWithHours >= active_start_total && startDateWithHours < active_end_total) || (endDateWithHours > active_start_total && endDateWithHours <= active_end_total) || (startDateWithHours < active_start_total && endDateWithHours > active_end_total);
      if(control){
        overlapping_control = true;
        break;
      }
    }

  // Returning feedback to the user if an overlap exists
  if(overlapping_control){
    return "The Leave Overlaps With Other Leaves.";
  }

  // If all fields of the form are validated,returning total requested days
  return parseFloat(numberOfDays)
}

async function sendRequest(formData,url){
  // Sending async ajax request to be able to make changes on the page dynamically
  var returned_data;
  await jQuery.ajax({
        type: "POST",
        url: url,
        data: formData,
        dataType: "json",
        encode: true,
      }).done(function (data) {
        returned_data = data;

  })
  return returned_data;

}

function logout(){
  jQuery(document).on("click","#logout-btn", (function (event) {
    // Preventing default behaviour of the tag
    event.preventDefault();
    // Validating the logout request using the sweetalert
    swalWithBootstrapButtons.fire({
          title: 'Are You Sure ?',
          text: "You Will Be Logged Out",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Logout',
          cancelButtonText: 'Close',
          reverseButtons: true
        }).then((result) =>  {
          if (result.isConfirmed) {
            // If logout request is confirmed,sending request to the corresponding url
            const xhr = new XMLHttpRequest();
            xhr.open("GET", "/logout");
            xhr.send();
            xhr.onload = () => {
              // If the operation is successful,changing window location to the login page
              if (xhr.readyState == 4 && xhr.status == 200) {
                console.log(xhr.response.status);
                window.location.href = "/";
              } else {
                console.log(`Error: ${xhr.status}`);
              }
            };

          } else if (
            /* Read more about handling dismissals below */
            result.dismiss === Swal.DismissReason.cancel
          ) {
            // Closing the modal
            Swal.close();
          }
        });

  }));

}




function calculateTime(date,check,control){
  let splitDate = date.split("/");

  // Calculating total time without using hour information.
  if(control == 0){
    var total_time =new Date(`${splitDate[1]}/${splitDate[0]}/${splitDate[2]}/`).getTime();
    return total_time;
  }
  // Calculating total time using hour information.
  let dateObject = new Date(
  +splitDate[2],
  +splitDate[1] - 1,
  +splitDate[0],
  check ? 9:13,
  0,
  0,
  );
  return dateObject.getTime();
}

function serializeForm(formID){
  // Serializing the form with the provided id value
  let array = jQuery(`#${formID}`).serializeArray();
  let formObject = {};
  jQuery.each(array,
        function(i, v) {
            formObject[v.name] = v.value;
        });
  return formObject;
}

function activateSearch(){
  // Filtering the rows on the panel according to the entered values on the input field.
  jQuery("#search-btn").on("keyup", function() {
    var value = jQuery(this).val().toLowerCase();
    jQuery("#personnel_list_table .list").filter(function() {
      jQuery(this).toggle(jQuery(this).text().toLowerCase().indexOf(value) > -1)
    });
  });


}
