using embeddingService as service from '../../srv/rag/service';

annotate embeddingService.CustFields @odata.draft.enabled;
annotate service.CustFields with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : 'SourceField',
                Value : SourceField,
            },
            {
                $Type : 'UI.DataField',
                Label : 'SourceDesc',
                Value : SourceDesc,
            },
            {
                $Type : 'UI.DataField',
                Label : 'SourceType',
                Value : SourceType,
            },
            {
                $Type : 'UI.DataField',
                Label : 'SourceLength',
                Value : SourceLength,
            },
            {
                $Type : 'UI.DataField',
                Label : 'SourceDecimals',
                Value : SourceDecimals,
            },
            {
                $Type : 'UI.DataField',
                Label : 'SourceTable',
                Value : SourceTable,
            },
            {
                $Type : 'UI.DataField',
                Label : 'TargetTable',
                Value : TargetTable,
            },
            {
                $Type : 'UI.DataField',
                Label : 'TargetField',
                Value : TargetField,
            },
            {
                $Type : 'UI.DataField',
                Label : 'TargetDesc',
                Value : TargetDesc,
            },
            {
                $Type : 'UI.DataField',
                Label : 'TargetType',
                Value : TargetType,
            },
            {
                $Type : 'UI.DataField',
                Label : 'TargetLength',
                Value : TargetLength,
            },
            {
                $Type : 'UI.DataField',
                Label : 'TargetDecimals',
                Value : TargetDecimals,
            },
            {
                $Type : 'UI.DataField',
                Label : 'KeyFlag',
                Value : KeyFlag,
            },
            {
                $Type : 'UI.DataField',
                Label : 'Obligatory',
                Value : Obligatory,
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : 'SourceField',
            Value : SourceField,
        },
        {
            $Type : 'UI.DataField',
            Label : 'SourceDesc',
            Value : SourceDesc,
        },
        {
            $Type : 'UI.DataField',
            Label : 'SourceType',
            Value : SourceType,
        },
        {
            $Type : 'UI.DataField',
            Label : 'SourceLength',
            Value : SourceLength,
        },
        {
            $Type : 'UI.DataField',
            Label : 'SourceDecimals',
            Value : SourceDecimals,
        },
    ],
);

