using {
    cuid,
    managed
} from '@sap/cds/common';

namespace pwc.hand.ifgenrag;

entity BusinessScenarios : cuid, managed {
    scenario     : String @title: 'Business Scenario';
    description  : String @title: 'Scenario Description';
    viewCategory : String @title: 'View Category';
    language     : String @title: 'Language';
    embeddings   : Vector(768);
}

entity CDSViews : cuid, managed {
    viewCategory : String @title: 'View Category';
    viewName     : String @title: 'View Name';
    viewDesc     : String @title: 'View Description';
    language     : String @title: 'Language';
    isActive     : Boolean;
}

entity CDSViewFiles : cuid, managed {
    category    : String;
    fileName    : String;
    size        : String;

    @Core.IsMediaType: true
    mediaType   : String;
    isGenerated : Boolean;

    @Core.MediaType: mediaType  @Core.ContentDisposition.Filename: fileName
    fileContent : LargeBinary;
    viewFields  : Composition of many Viewfields
                      on viewFields.file = $self;
}

entity Viewfields : cuid, managed {
    file                 : Association to CDSViewFiles;
    category             : String;
    content              : LargeString;
    isGeneratedEmbedding : Boolean;
    tableName            : String;
    tableDesc            : String;
    langu                : String;
    embeddings           : Vector(768);
}

entity CustFields : cuid, managed {
    SourceField    : String; //Source field name
    SourceDesc     : String;  //Source field description
    SourceType     : String;  //Source field type
    SourceLength   : Integer; //Source field length
    SourceDecimals : Integer; //Source field decimals
    SourceTable    : String;  //Source table name
    TargetTable    : String;  //Target table name
    TargetField    : String;  //Target field name
    TargetDesc     : String;  //Target field description
    TargetType     : String;  //Target field type
    TargetLength   : Integer; //Target field length
    TargetDecimals : Integer; //Target field decimals
    KeyFlag        : String(1); //Key flag
    Obligatory     : String; //Obligatory flag
}
