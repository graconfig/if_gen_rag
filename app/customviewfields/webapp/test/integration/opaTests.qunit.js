sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'customviewfields/test/integration/FirstJourney',
		'customviewfields/test/integration/pages/CustFieldsList',
		'customviewfields/test/integration/pages/CustFieldsObjectPage'
    ],
    function(JourneyRunner, opaJourney, CustFieldsList, CustFieldsObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('customviewfields') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheCustFieldsList: CustFieldsList,
					onTheCustFieldsObjectPage: CustFieldsObjectPage
                }
            },
            opaJourney.run
        );
    }
);