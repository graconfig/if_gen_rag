using embeddingService as service from '../../srv/rag/service';

annotate service.CDSViews with @odata.draft.enabled;

annotate service.CDSViews with @(
    UI.HeaderInfo:{
        TypeName:'Views',
        TypeNamePlural:'Views'
    },

    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : viewCategory,
            },
            {
                $Type : 'UI.DataField',
                Value : viewName,
            },
            {
                $Type : 'UI.DataField',
                Value : viewDesc,
            },
            {
                $Type : 'UI.DataField',
                Value : language,
            },
            {
                $Type : 'UI.DataField',
                Value : isActive,
                Label : 'is Active',
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
            Value : viewCategory,
        },
        {
            $Type : 'UI.DataField',
            Value : viewName,
        },
        {
            $Type : 'UI.DataField',
            Value : viewDesc,
        },
        {
            $Type : 'UI.DataField',
            Value : language,
        },
        {
            $Type : 'UI.DataField',
            Value : isActive,
            Label : 'isActive',
        },
    ],
);

