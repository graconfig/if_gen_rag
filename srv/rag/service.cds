using {pwc.hand.ifgenrag as db} from '../../db/schema';

service embeddingService @(path: '/embedding') {
    //Business scenarios
    entity BusinessScenarios as
        projection on db.BusinessScenarios
        excluding {
            embeddings
        };

    entity CDSViews          as projection on db.CDSViews;

    @cds.persistence.skip: true
    @odata.singleton
    entity excelupload {
        @Core.MediaType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        excel : LargeBinary;
    };

    action cdsViewsSearch(question : String, threshold : Decimal(5, 2), langu : String)  returns array of CDSViews;

    //CDS View Fields RAG 2.0
    entity CDSViewFiles      as 
        projection on db.CDSViewFiles
        actions {
            action generateEmbeddings()  returns String;
            action deleteEmbeddings()    returns String;
        };

    entity Viewfields        as
        projection on db.Viewfields
        excluding {
            embeddings
        };

    entity CustFields        as
        projection on db.CustFields;

    action viewFieldsSearch(question : String, threshold : Decimal(5, 2), langu : String) returns array of Viewfields;
}
