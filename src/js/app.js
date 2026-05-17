const Web3 = require('web3');
const contract = require('@truffle/contract');

const votingArtifacts = require('../../build/contracts/Voting.json');
var VotingContract = contract(votingArtifacts);

window.App = {
  account: null,
  instance: null,

  eventStart: async function () {
    try {
      // Connect MetaMask properly
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      App.account = accounts[0];
      $("#accountAddress").html("Your Account: " + App.account);

      // Setup provider
      window.web3 = new Web3(window.ethereum);
      VotingContract.setProvider(window.ethereum);

      // Get contract instance
      App.instance = await VotingContract.deployed();

      const countCandidates = await App.instance.getCountCandidates();

      // ----------------------------
      // ADD CANDIDATE
      // ----------------------------
      $('#addCandidate').click(async function () {
        try {
          const nameCandidate = $('#name').val();
          const partyCandidate = $('#party').val();

          await App.instance.addCandidate(nameCandidate, partyCandidate, {
            from: App.account
          });

          console.log("Candidate added");
          window.location.reload();

        } catch (err) {
          console.error("Add Candidate Error:", err);
        }
      });

      // ----------------------------
      // SET DATES (DEBUG ADDED)
      // ----------------------------
      $('#addDate').click(async function () {
        try {
          const startDate = Date.parse($("#startDate").val()) / 1000;
          const endDate = Date.parse($("#endDate").val()) / 1000;

          // 🔥 DEBUG LOGS
          console.log("RAW START INPUT:", $("#startDate").val());
          console.log("RAW END INPUT:", $("#endDate").val());

          console.log("PARSED START (epoch):", startDate);
          console.log("PARSED END (epoch):", endDate);

          console.log("CURRENT TIME (epoch):", Math.floor(Date.now() / 1000));

          await App.instance.setDates(startDate, endDate, {
            from: App.account
          });

          console.log("Dates set successfully");

        } catch (err) {
          console.error("Set Dates Error:", err);
        }
      });

      // ----------------------------
      // LOAD DATES
      // ----------------------------
      try {
        const result = await App.instance.getDates();

        console.log("📦 ON-CHAIN START:", result[0].toString());
        console.log("📦 ON-CHAIN END:", result[1].toString());

        console.log("📦 START DATE HUMAN:", new Date(result[0] * 1000));
        console.log("📦 END DATE HUMAN:", new Date(result[1] * 1000));

        console.log("⏰ NOW:", new Date());

        const startDate = new Date(result[0] * 1000);
        const endDate = new Date(result[1] * 1000);

        $("#dates").text(
          startDate.toDateString() + " - " + endDate.toDateString()
        );

      } catch (err) {
        console.error("Get Dates Error:", err);
      }

      // ----------------------------
      // LOAD CANDIDATES
      // ----------------------------
      for (let i = 0; i < countCandidates; i++) {
        const data = await App.instance.getCandidate(i + 1);

        const row = `
          <tr>
            <td>
              <input type="radio" name="candidate" value="${data[0]}">
              ${data[1]}
            </td>
            <td>${data[2]}</td>
            <td>${data[3]}</td>
          </tr>
        `;

        $("#boxCandidate").append(row);
      }

      // ----------------------------
      // CHECK IF ALREADY VOTED
      // ----------------------------
      const voted = await App.instance.checkVote();

      if (!voted) {
        $("#voteButton").attr("disabled", false);
      }

    } catch (err) {
      console.error("Init Error:", err);
    }
  },

  // ----------------------------
  // VOTE
  // ----------------------------
  vote: async function () {
    console.log("🔥 VOTE FUNCTION TRIGGERED");
    try {
      const candidateID = $("input[name='candidate']:checked").val();

      console.log("🗳 Selected candidate:", candidateID);

      if (!candidateID) {
        $("#msg").html("<p>Please vote for a candidate.</p>");
        return;
      }

      await App.instance.vote(parseInt(candidateID), {
        from: App.account
      });

      $("#voteButton").attr("disabled", true);
      $("#msg").html("<p>Voted Successfully</p>");

      window.location.reload();

    } catch (err) {
      console.error("Vote Error:", err);
    }
  }
};

// ----------------------------
// APP LOAD
// ----------------------------
window.addEventListener("load", function () {
  if (window.ethereum) {
    console.log("Using MetaMask");
  } else {
    alert("Please install MetaMask!");
  }

  window.App.eventStart();
});