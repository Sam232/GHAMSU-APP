$(document).ready(function(){
  //Login Forms
  //Large Devices
  $("#usernameForm").on("focus", () => {
    $("#usernameForm").css("border-bottom", "1px solid blue");
    $("#usernameLabel").css("color", "#9e9e9e");
  });

  $("#usernameForm").on("blur", () => {
    $("#usernameLabel").css("color", "#9e9e9e");
  });

  $("#passwordForm").on("focus", () => {
    $("#passwordForm").css("border-bottom", "1px solid blue");
    $("#passwordLabel").css("color", "#9e9e9e")
  });

  $("#passwordForm").on("blur", () => {
    $("#passwordLabel").css("color", "#9e9e9e")
  });

  //Medium and Small Devices Forms
  $("#usernameForm2").on("focus", () => {
    $("#usernameForm2").css("border-bottom", "1px solid blue");
    $("#usernameLabel2").css("color", "#9e9e9e")
  });

  $("#usernameForm2").on("blur", () => {
    $("#usernameLabel2").css("color", "#9e9e9e")
  });

  $("#passwordForm2").on("focus", () => {
    $("#passwordForm2").css("border-bottom", "1px solid blue");
    $("#passwordLabel2").css("color", "#9e9e9e")
  });                        

  $("#passwordForm2").on("blur", () => {
    $("#passwordLabel2").css("color", "#9e9e9e")
  });

  //Add Sub Admin Form
  $("#addForm1").on("focus", () => {
    $("#addForm1").css("border-bottom", "1px solid blue");
    $("#addLabel1").css("color", "#9e9e9e")
  });

  $("#addForm1").on("blur", () => {
    $("#addLabel1").css("color", "#9e9e9e")
  });

  $("#addForm2").on("focus", () => {
    $("#addForm2").css("border-bottom", "1px solid blue");
    $("#addLabel2").css("color", "#9e9e9e")
  });

  $("#addForm2").on("blur", () => {
    $("#addLabel2").css("color", "#9e9e9e")
  });

  $("#addForm3").on("focus", () => {
    $("#addForm3").css("border-bottom", "1px solid blue");
    $("#addLabel3").css("color", "#9e9e9e")
  });

  $("#addForm3").on("blur", () => {
    $("#addLabel3").css("color", "#9e9e9e")
  });

  //Managing Sub Admins Forms
  $("#userName").on("focus", () => {
    $("#userName").css("border-bottom", "1px solid blue");
    $("#userName1").css("color", "#9e9e9e");
  });

  $("#userName").on("blur", () => {
    $("#userName").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#institution").on("focus", () => {
    $("#institution").css("border-bottom", "1px solid blue");
    $("#institution1").css("color", "#9e9e9e");
  });

  $("#institution").on("blur", () => {
    $("#institution").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#membersNumber").on("focus", () => {
    $("#membersNumber").css("border-bottom", "1px solid blue");
    $("#membersNumber1").css("color", "#9e9e9e");
  });

  $("#membersNumber").on("blur", () => {
    $("#membersNumber").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#phone").on("focus", () => {
    $("#phone").css("border-bottom", "1px solid blue");
    $("#phone1").css("color", "#9e9e9e");
  });

  $("#phone").on("blur", () => {
    $("#phone").css("border-bottom", "1px solid #9e9e9e");
  });

  //Manage SubAdmins2
  $(".delete").on("click", () => {
    var username = $(".main td.userName").html();

    $(".subAdminUsername").val(username);
  });

  //Manage Admin Forms
  $("#username3").on("focus", () => {
    $("#username3").css("border-bottom", "1px solid blue");
    $("#username4").css("color", "#9e9e9e")
  });

  $("#username3").on("blur", () => {
    $("#username3").css("border-bottom", "1px solid #9e9e9e")
  });

  $("#oldPassword3").on("focus", () => {
    $("#oldPassword3").css("border-bottom", "1px solid blue");
    $("#oldPassword4").css("color", "#9e9e9e")
  });                        

  $("#oldPassword3").on("blur", () => {
    $("#oldPassword3").css("border-bottom", "1px solid #9e9e9e")
  });

  $("#newPassword3").on("focus", () => {
    $("#newPassword3").css("border-bottom", "1px solid blue");
    $("#newPassword4").css("color", "#9e9e9e")
  });                        

  $("#newPassword3").on("blur", () => {
    $("#newPassword3").css("border-bottom", "1px solid #9e9e9e")
  });

  //AddNewMember
  $("#mFirstName").on("focus", () => {
    $("#mFirstName").css("border-bottom", "1px solid blue");
    $("#mFirstName1").css("color", "#9e9e9e");
  });
  $("#mFirstName").on("blur", () => {
    $("#mFirstName").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#mLastName").on("focus", () => {
    $("#mLastName").css("border-bottom", "1px solid blue");
    $("#mLastName1").css("color", "#9e9e9e");
  });
  $("#mLastName").on("blur", () => {
    $("#mLastName").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#mGender").on("focus", () => {
    $("#mGender").css("border-bottom", "1px solid blue");
    $("#mGender1").css("color", "#9e9e9e");
  });
  $("#mGender").on("focus", () => {
    $("#mGender").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#mInstitution").on("focus", () => {
    $("#mInstitution").css("border-bottom", "1px solid blue");
    $("#mInstitution1").css("color", "#9e9e9e");
  });
  $("#mInstitution").on("blur", () => {
    $("#mInstitution").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#mProgramme").on("focus", () => {
    $("#mProgramme").css("border-bottom", "1px solid blue");
    $("#mProgramme1").css("color", "#9e9e9e");
  });
  $("#mProgramme").on("blur", () => {
    $("#mProgramme").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#mNationality").on("focus", () => {
    $("#mNationality").css("border-bottom", "1px solid blue");
    $("#mNationality1").css("color", "#9e9e9e");
  });
  $("#mNationality").on("blur", () => {
    $("#mNationality").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#mCity").on("focus", () => {
    $("#mCity").css("border-bottom", "1px solid blue");
    $("#mCity1").css("color", "#9e9e9e");
  });
  $("#mCity").on("blur", () => {
    $("#mCity").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#mDOB").on("focus", () => {
    $("#mDOB").css("border-bottom", "1px solid blue");
  });
  $("#mDOB").on("blur", () => {
    $("#mDOB").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#mEmail").on("focus", () => {
    $("#mEmail").css("border-bottom", "1px solid blue");
    $("#mEmail1").css("color", "#9e9e9e");
  });
  $("#mEmail").on("blur", () => {
    $("#mEmail").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#mNumber").on("focus", () => {
    $("#mNumber").css("border-bottom", "1px solid blue");
    $("#mNumber1").css("color", "#9e9e9e");
  });
  $("#mNumber").on("blur", () => {
    $("#mNumber").css("border-bottom", "1px solid #9e9e9e");
  });

  //Update SubAdmin Login Details
  $("#userName01").on("focus", () => {
    $("#userName01").css("border-bottom", "1px solid blue");
    $("#userName02").css("color", "#9e9e9e");
  });
  $("#userName01").on("blur", () => {
    $("#userName01").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#phone01").on("focus", () => {
    $("#phone01").css("border-bottom", "1px solid blue");
    $("#phone02").css("color", "#9e9e9e");
  });
  $("#phone01").on("blur", () => {
    $("#phone01").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#password01").on("focus", () => {
    $("#password01").css("border-bottom", "1px solid blue");
    $("#password02").css("color", "#9e9e9e");
  });
  $("#password01").on("blur", () => {
    $("#password01").css("border-bottom", "1px solid #9e9e9e");
  });

  $("#password03").on("focus", () => {
    $("#password03").css("border-bottom", "1px solid blue");
    $("#password04").css("color", "#9e9e9e");
  });
  $("#password03").on("blur", () => {
    $("#password03").css("border-bottom", "1px solid #9e9e9e");
  });

  //MaterializeCSS
  $(".button-collapse").sideNav();
  $(".modal").modal();
  $("select").material_select();
  
  $("#institutionName").on("focus", () => {
    $("#institutionName").css("border-bottom", "1px solid blue");
    $("#institutionLabel").css("color", "#9e9e9e");
  });
  $("#institutionName").on("blur", () => {
    $("#institutionName").css("border-bottom", "1px solid #9e9e9e");
  });
});