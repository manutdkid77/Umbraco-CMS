using System.Collections.Generic;
using System.Linq;
using Umbraco.Core;
using Umbraco.Core.Models;
using Umbraco.Tests.Common.Builders.Extensions;
using Umbraco.Tests.Common.Builders.Interfaces;

namespace Umbraco.Tests.Common.Builders
{
    public class ContentTypeBuilder
        : ContentTypeBaseBuilder<ContentBuilder, IContentType>,
            IWithPropertyTypeIdsIncrementingFrom,
            IBuildPropertyTypes
    {
        private List<PropertyGroupBuilder<ContentTypeBuilder>> _propertyGroupBuilders = new List<PropertyGroupBuilder<ContentTypeBuilder>>();
        private List<PropertyTypeBuilder<ContentTypeBuilder>> _noGroupPropertyTypeBuilders = new List<PropertyTypeBuilder<ContentTypeBuilder>>();
        private List<TemplateBuilder> _templateBuilders = new List<TemplateBuilder>();
        private List<ContentTypeSortBuilder> _allowedContentTypeBuilders = new List<ContentTypeSortBuilder>();

        private int? _propertyTypeIdsIncrementingFrom;
        private int? _defaultTemplateId;
        protected ContentVariation? _contentVariation;

        public ContentTypeBuilder() : base(null)
        {
        }

        public ContentTypeBuilder(ContentBuilder parentBuilder) : base(parentBuilder)
        {
        }

        public ContentTypeBuilder WithDefaultTemplateId(int templateId)
        {
            _defaultTemplateId = templateId;
            return this;
        }

        public ContentTypeBuilder WithContentVariation(ContentVariation contentVariation)
        {
            _contentVariation = contentVariation;
            return this;
        }

        public PropertyGroupBuilder<ContentTypeBuilder> AddPropertyGroup()
        {
            var builder = new PropertyGroupBuilder<ContentTypeBuilder>(this);
            _propertyGroupBuilders.Add(builder);
            return builder;
        }

        public PropertyTypeBuilder<ContentTypeBuilder> AddPropertyType()
        {
            var builder = new PropertyTypeBuilder<ContentTypeBuilder>(this);
            _noGroupPropertyTypeBuilders.Add(builder);
            return builder;
        }

        public TemplateBuilder AddAllowedTemplate()
        {
            var builder = new TemplateBuilder(this);
            _templateBuilders.Add(builder);
            return builder;
        }

        public ContentTypeSortBuilder AddAllowedContentType()
        {
            var builder = new ContentTypeSortBuilder(this);
            _allowedContentTypeBuilders.Add(builder);
            return builder;
        }

        public override IContentType Build()
        {
            var contentType = new ContentType(ShortStringHelper, GetParentId())
            {
                Id = GetId(),
                Key = GetKey(),
                CreateDate = GetCreateDate(),
                UpdateDate = GetUpdateDate(),
                Alias = GetAlias(),
                Name = GetName(),
                Level = GetLevel(),
                Path = GetPath(),
                SortOrder = GetSortOrder(),
                Description = GetDescription(),
                Icon = GetIcon(),
                Thumbnail = GetThumbnail(),
                CreatorId = GetCreatorId(),
                Trashed = GetTrashed(),
                IsContainer = GetIsContainer(),
            };

            var contentVariation = _contentVariation ?? ContentVariation.Nothing;
            contentType.Variations = contentVariation;

            contentType.NoGroupPropertyTypes =  _noGroupPropertyTypeBuilders.Select(x => x.Build());
            BuildPropertyGroups(contentType, _propertyGroupBuilders.Select(x => x.Build()));
            BuildPropertyTypeIds(contentType, _propertyTypeIdsIncrementingFrom);

            contentType.AllowedContentTypes = _allowedContentTypeBuilders.Select(x => x.Build());

            contentType.AllowedTemplates = _templateBuilders.Select(x => x.Build());
            if (_defaultTemplateId.HasValue)
            {
                contentType.SetDefaultTemplate(contentType.AllowedTemplates
                    .SingleOrDefault(x => x.Id == _defaultTemplateId.Value));
            }

            contentType.ResetDirtyProperties(false);

            return contentType;
        }

        public static ContentType CreateBasicContentType(string alias = "basePage", string name = "Base Page", IContentType parent = null)
        {
            var builder = new ContentTypeBuilder();
            return (ContentType)builder
                .WithAlias(alias)
                .WithName(name)
                .WithParentId(parent?.Id ?? -1)
                .Build();
        }

        public static ContentType CreateSimpleContentType(string alias = null, string name = null, IContentType parent = null, bool randomizeAliases = false, string propertyGroupName = "Content", int defaultTemplateId = 1)
        {
            return (ContentType)new ContentTypeBuilder()
                .WithAlias(alias ?? "simple")
                .WithName(name ?? "Simple Page")
                .WithParentId(parent?.Id ?? -1)
                .AddPropertyGroup()
                    .WithName(propertyGroupName)
                    .WithSortOrder(1)
                    .WithSupportsPublishing(true)
                    .AddPropertyType()
                        .WithAlias(RandomAlias("title", randomizeAliases))
                        .WithName("Title")
                        .WithSortOrder(1)
                        .Done()
                    .AddPropertyType()
                        .WithPropertyEditorAlias(Constants.PropertyEditors.Aliases.TinyMce)
                        .WithValueStorageType(ValueStorageType.Ntext)
                        .WithAlias(RandomAlias("bodyText", randomizeAliases))
                        .WithName("Body text")
                        .WithSortOrder(2)
                        .WithDataTypeId(-87)
                        .Done()
                    .AddPropertyType()
                        .WithAlias(RandomAlias("author", randomizeAliases))
                        .WithName("Author")
                        .WithSortOrder(3)
                        .Done()
                    .Done()
                    .AddAllowedTemplate()
                        .WithId(defaultTemplateId)
                        .WithAlias("textPage")
                        .WithName("Textpage")
                        .Done()
                    .WithDefaultTemplateId(defaultTemplateId)
                .Build();
        }

        public static ContentType CreateTextPageContentType(string alias = "textPage", int defaultTemplateId = 1)
        {
            var builder = new ContentTypeBuilder();
            return (ContentType)builder
                .WithAlias(alias)
                .WithName("Text Page")
                .AddPropertyGroup()
                    .WithId(1)
                    .WithName("Content")
                    .WithSortOrder(1)
                    .WithSupportsPublishing(true)
                    .AddPropertyType()
                        .WithAlias("title")
                        .WithName("Title")
                        .WithSortOrder(1)
                        .Done()
                    .AddPropertyType()
                        .WithPropertyEditorAlias(Constants.PropertyEditors.Aliases.TinyMce)
                        .WithValueStorageType(ValueStorageType.Ntext)
                        .WithAlias("bodyText")
                        .WithName("Body text")
                        .WithSortOrder(2)
                        .WithDataTypeId(-87)
                        .Done()
                    .Done()
                .AddPropertyGroup()
                    .WithId(2)
                    .WithName("Meta")
                    .WithSortOrder(2)
                    .WithSupportsPublishing(true)
                    .AddPropertyType()
                        .WithAlias("keywords")
                        .WithName("Keywords")
                        .WithSortOrder(1)
                        .Done()
                    .AddPropertyType()
                        .WithAlias("description")
                        .WithName("Description")
                        .WithSortOrder(2)
                        .Done()
                    .Done()
                .AddAllowedTemplate()
                    .WithId(defaultTemplateId)
                    .WithAlias("textpage")
                    .WithName("Textpage")
                    .Done()
                .WithDefaultTemplateId(defaultTemplateId)
                .Build();
        }

        int? IWithPropertyTypeIdsIncrementingFrom.PropertyTypeIdsIncrementingFrom
        {
            get => _propertyTypeIdsIncrementingFrom;
            set => _propertyTypeIdsIncrementingFrom = value;
        }
    }
}
