# src/app/pages/home/home.component.html
home-hero-subtitle = 'cause the world is multidimensional.
home-hero-iiif-tagline = An open source 3D viewer working towards IIIF compliance
home-features-formats = Wide format variety
home-features-formats-text = We support a comprehensive range of formats including 3D models, point clouds, and Gaussian splatting models.
home-features-explore = Explore, Annotate, Collaborate
home-features-explore-text = Explore and annotate objects in 3D, create your own collections and collaborate within your community.
home-features-open-source = Open source
home-features-open-source-text = Kompakkt is free and open source. Everyone is invited to contribute and help us build the future of 3D viewing.
home-news = Latest updates and blog posts
home-news-add = Add news
home-news-unpublished-hide = Hide unpublished news
home-news-unpublished-show = Show unpublished news

# src/app/pages/explore/explore.component.html
explore-heading = Explore
explore-filters-active = You have activated filters, modifying the search results
explore-loading-hint = Loading results. This can sometimes take a moment
explore-no-results = No results found
explore-clear-filters-hint = Try clearing some filters or changing the search text to find more results.
explore-paginator = Page { $currentPage } of { $totalPages }
explore-paginator-results = Results { $fromItem } - { $toItem } of { $totalItems } results

# src/app/pages/explore/shared-types.ts
explore-filter-option-sort-by-newest = Most recent
explore-filter-option-sort-by-most-popular = Most popular
explore-filter-option-sort-by-most-annotations = Most annotations
explore-filter-option-sort-by-alphabetical-ascending = Alphabetical (A-Z)
explore-filter-option-sort-by-alphabetical-descending = Alphabetical (Z-A)
explore-filter-option-media-type-model = 3D models
explore-filter-option-media-type-cloud = Point clouds
explore-filter-option-media-type-splat = 3D Gaussian splats
explore-filter-option-media-type-image = Images
explore-filter-option-media-type-video = Videos
explore-filter-option-media-type-audio = Audio
explore-filter-option-annotation-with = With annotations
explore-filter-option-annotation-without = Without annotations
explore-filter-option-access-owner = Owner
explore-filter-option-access-editor = Editor
explore-filter-option-access-viewer = Viewer
explore-filter-option-misc-downloadable = Downloadable
explore-filter-option-licence-cc0 = CC0
explore-filter-option-licence-pdm = PDM 1.0
explore-filter-option-licence-by = CC BY 4.0
explore-filter-option-licence-by-sa = CC BY-SA 4.0
explore-filter-option-licence-by-nd = CC BY-ND 4.0
explore-filter-option-licence-by-nc = CC BY-NC 4.0
explore-filter-option-licence-by-nc-sa = CC BY-NC-SA 4.0
explore-filter-option-licence-by-nc-nd = CC BY-NC-ND 4.0
explore-filter-option-licence-all-rights-reserved = All rights reserved

# src/app/components/navigation/footer/footer.component.html
footer-user-documentation-link = User Documentation
footer-github-landing-alt = Kompakkt on Github - Landing Page
footer-about-link = About
footer-imprint-link = Imprint
footer-privacy-policy-link = Privacy Policy
footer-terms-of-use-link = Terms of Use
footer-consortium-link = Consortium

# src/app/dialogs/confirmation-dialog/confirmation-dialog.component.html
confirmation-dialog-no-button = No
confirmation-dialog-yes-button = Yes

# src/app/dialogs/forgot-username-dialog/forgot-username-dialog.component.html
forgot-username-dialog-title = Forgot your username?
forgot-username-dialog-hint = You can request your username using your e-mail address!
forgot-username-dialog-submit = Send e-mail

# src/app/dialogs/forgot-password-dialog/forgot-password-dialog.component.html
forgot-password-dialog-title = Forgot your password?
forgot-password-dialog-hint = You can request your password using your username and will receive a mail!
forgot-password-dialog-username-label = Enter your username
forgot-password-dialog-submit = Submit password request

# src/app/dialogs/reset-password-dialog/reset-password-dialog.component.html
reset-password-dialog-title = Choose a new password
reset-password-dialog-submit = Change your password

# Button texts used by multiple buttons throughout
button-explore = Explore
button-open = Open
button-add = Add
button-add-to-collection = Add to collection
button-annotate = Annotate
button-visibility-and-access = Visibility and access
button-transfer-ownership = Transfer ownership
button-delete = Delete
button-cancel = Cancel
button-save = Save
button-next = Next
button-back = Back
button-ok = Ok
button-login = Login
button-register = Register
button-logout = Logout
button-new-object = New object

# src/app/pages/notfound/notfound.component.html
notfound-message-missing-resource = The resource you requested does not exist.

# src/app/components/grid-element/grid-element.component.html
grid-element-tooltip-view-object = Click to view object
grid-element-tooltip-view-collection = Click to view collection
grid-element-badge-private = Private

# src/app/components/uploaded-by/uploaded-by.component.html
uploaded-by-heading = Published by

# Alt text of profile and agent pictures, used by multiple components
profile-image-alt = Profile picture of { $name }

# Logo alt texts used by the navigation bar and the home page
logo-custom-alt = Custom Kompakkt Logo
logo-alt = Kompakkt Logo

# src/app/components/search-bar/search-bar.component.html
search-bar-placeholder = Search

# src/app/components/news-card/news-card.component.html
news-card-badge-unpublished = Unpublished
news-card-tooltip-edit = Edit
news-card-tooltip-delete = Delete
news-card-preview-title = Preview title
news-card-preview-content = Preview content text...

# src/app/dialogs/remove-from-compilation/remove-from-compilation.component.html
remove-from-compilation-dialog-title = Remove objects from collection
remove-from-compilation-dialog-hint = Select the objects you want to remove from this collection.
remove-from-compilation-dialog-submit = Remove selected

# src/app/components/selection/selection-tab/selection-tab.component.html
selection-tab-count-selected = { $count } selected
selection-tab-button-multi-select = Multi-select

# src/app/pages/explore/explore-filter-sidenav/explore-filter-sidenav.component.html
explore-filter-sidenav-sort-by-label = Sort by
explore-filter-sidenav-media-types-label = Media types
explore-filter-sidenav-annotations-label = Annotations
explore-filter-sidenav-access-label = Access
explore-filter-sidenav-licences-label = Licences
explore-filter-sidenav-misc-label = Other
explore-filter-sidenav-show-results-button = Show results
explore-filter-sidenav-clear-all-button = Clear all

# src/app/pages/explore/explore-filter-sidenav/explore-filter-sidenav.component.ts
explore-filter-sidenav-title = Filter and sort

# src/app/components/navigation/sidenav-list/sidenav-list.component.html
home-heading = Home
contact-heading = Contact
admin-heading = Admin

# src/app/components/navigation/sidenav-list/sidenav-list.component.ts
sidenav-list-title = Navigation

# src/app/dialogs/register-dialog/register-dialog.component.html
register-dialog-title = Register
register-dialog-mail-label = E-Mail address
register-dialog-prename-label = First name
register-dialog-surname-label = Last name
register-dialog-username-label = Username
register-dialog-password-label = Password
register-dialog-password-repeat-label = Repeat password
register-dialog-submit = Create new account
register-dialog-has-account-hint = Already have an account?
register-dialog-login-link = Login

# src/app/dialogs/profile-page-edit/profile-page-edit.component.html
profile-page-edit-title-profile = Edit profile
profile-page-edit-title-organization = Edit organizational profile
profile-page-edit-change-picture = Change profile picture
profile-page-edit-name-label = Name
profile-page-edit-organization-name-placeholder = Enter the name of your organization
profile-page-edit-display-name-label = Display name
profile-page-edit-display-name-placeholder = Enter the name you want displayed on your profile page
profile-page-edit-location-label = Location
profile-page-edit-location-placeholder = Enter your location
profile-page-edit-website-label = Website
profile-page-edit-website-placeholder = Enter your website
profile-page-edit-description-label = Description
profile-page-edit-description-placeholder = Add a short description
profile-page-edit-member-label = Member
profile-page-edit-add-person-placeholder = Add persons
profile-page-edit-members-loading = Fetching accounts...
profile-page-edit-members-load-failed = Members could not be loaded.
profile-page-edit-member-role-admin = Admin
profile-page-edit-member-role-member = Member

# src/app/components/metadata/entity/entity.component.html
entity-tab-general = General information
entity-tab-licence = Licence
entity-tab-related-agents = Related persons and institutions
entity-tab-creation = Creation
entity-tab-identifiers = External Identifiers
entity-tab-links = External Links
entity-tab-biblio-refs = Bibliographic references
entity-tab-metadata-files = Metadata files
entity-tab-reference-object = Reference object
entity-optional-metadata-heading = Optional metadata:
entity-tooltip-required-fields = Section contains required fields

# src/app/metadata/index.ts
entity-validation-title-required = Title is required
entity-validation-description-required = Description is required
entity-validation-licence-required = Licence is required
entity-validation-licence-attribution-required = This licence requires an attribution
entity-validation-agents-required = At least one agent is required
entity-validation-rights-owner-required = At least one rights owner is required
entity-validation-contact-person-required = At least one contact person is required
entity-validation-place-name-required = Place requires at least a name

# src/app/components/metadata/agents/agents.component.html
agents-related-heading = Related persons and institutions
agents-person-tab = Person
agents-institution-tab = Institution
agents-prename-label = Prename
agents-name-label = Name
agents-mail-label = E-Mail address
agents-phone-label = Phone number
agents-department-label = Department
agents-country-label = Country
agents-postal-code-label = Postal Code
agents-city-label = City
agents-street-label = Street
agents-number-label = Number
agents-building-label = Building
agents-autocomplete-you-hint = (you)
agents-autocomplete-already-added-hint = (already added, see below to edit)
agents-role-selection-heading = Assigned role(s)
agents-custom-role-placeholder = Custom role
agents-clear-button = Clear
agents-update-button = Update
agents-add-button = Add

# src/app/components/metadata/agents/shared.ts
agents-role-default-rights-owner = Rightsowner
agents-role-default-contact-person = Contact person

# src/app/components/metadata/agents/agent-list/agent-list.component.html
agent-list-rights-owner-heading = Rightsowner:*
agent-list-contact-person-heading = Contact person:*
agent-list-custom-role-heading = { $role }:

# src/app/components/metadata/address/address.component.html
address-country-label = Country
address-country-placeholder = Enter a country
address-postal-code-label = Postal Code
address-postal-code-placeholder = Enter a postal code
address-city-label = City
address-city-placeholder = Enter a city
address-street-label = Street
address-street-placeholder = Enter a street
address-number-label = Number
address-number-placeholder = Enter a number
address-building-label = Building
address-building-placeholder = Enter a building

# src/app/components/metadata/optional/dimension/dimension.component.html
dimension-heading = Dimension
dimension-unit-description-label = Unit description (e.g. Width of base)
dimension-unit-description-placeholder = Enter a description
dimension-unit-value-label = Unit value
dimension-unit-value-placeholder = Enter a value
dimension-unit-type-label = Unit type
dimension-unit-type-placeholder = Enter a type

# src/app/components/metadata/optional/phys-obj/phys-obj.component.html
phys-obj-reference-object-heading = Reference Object
phys-obj-place-heading = Place
phys-obj-place-name-label = Name
phys-obj-place-name-placeholder = Enter a name
phys-obj-place-geopolitical-area-label = Geopolitical area
phys-obj-place-geopolitical-area-placeholder = Enter a geopolitical area

# src/app/components/metadata/optional/phys-obj/phys-obj.component.ts
phys-obj-place-name-required = Place name is required

# src/app/components/metadata/optional/creation/creation.component.html
creation-heading = Creation
creation-technique-label = Add technique (e.g. Laserscan or Modelling)
creation-software-label = Add program
creation-equipment-label = Add equipment
creation-date-range-label = Add creation date range

# src/app/components/metadata/optional/links/links.component.html
links-heading = External links
links-description-label = Description
links-description-placeholder = Enter a description
links-url-label = URL
links-url-placeholder = Enter an URL

# src/app/components/metadata/optional/metadata-files/metadata-files.component.html
metadata-files-heading = Metadata files
metadata-files-hint = Add external meta data files. These files will be available for download.

# src/app/components/metadata/optional/biblio-ref/biblio-ref.component.html
biblio-ref-heading = Bibliographic references
biblio-ref-description-label = Description
biblio-ref-description-placeholder = Enter a description
biblio-ref-reference-label = Reference (e.g. Title, Author, Year)
biblio-ref-reference-placeholder = Enter value
biblio-ref-clear-button = Clear
biblio-ref-update-button = Update

# src/app/components/metadata/optional/external-ids/external-ids.component.html
external-ids-heading = External identifiers
external-ids-type-label = Type (e.g. DOI)
external-ids-type-placeholder = Enter a type
external-ids-value-label = Value
external-ids-value-placeholder = Enter a value

# src/app/components/metadata/licence/licence.component.html
licence-heading = License
licence-attribution-label = Attribution*
licence-attribution-placeholder = Enter a creator
licence-info-heading = INFO
licence-info-message = Copyrighted as well as Creative-Commons-licensed content requires attribution of the original author unless otherwise specified by the license.
licence-info-more-information-link = More information

# src/app/dialogs/entity-download-dialog/entity-download-dialog.component.html
entity-download-dialog-licence-heading = Licensing information
entity-download-dialog-licence-learn-more = Learn more
entity-download-dialog-downloads-heading = Available downloads
entity-download-dialog-raw-files-heading = Raw files
entity-download-dialog-processed-files-heading = Processed files
entity-download-dialog-size-uncompressed = Uncompressed size
entity-download-dialog-size-compressed = Compressed size
entity-download-dialog-size-not-compressed = Not compressed yet
entity-download-dialog-file-types = File types
entity-download-dialog-download-archive-button = Download archive
entity-download-dialog-prepare-archive-button = Prepare archive
entity-download-dialog-preparing-archive-button = Preparing archive

# src/app/components/pagination/pagination.component.html
pagination-page = Page { $currentPage } of { $totalPages }
pagination-results = Results { $fromItem } - { $toItem } of { $totalItems } results

# src/app/pages/annotate/annotate.component.html
annotate-heading = Annotate
annotate-help-what-heading = What are annotations?
annotate-help-what-text = Annotations are multimedia containers that allow you to attach descriptions or references to points in space from a chosen camera perspective on 3D objects in Kompakkt. Through the selection of different perspectives on consecutive annotations you can generate a walk-through. Annotations can contain text, images, AV media, URLs and more. You can annotate your own objects with default annotations visible to everyone else. You can also create your own private annotations or annotate other people’s objects by creating a collection and then annotating the objects you curate into this collection.
annotate-help-how-heading = How to annotate objects in Kompakkt?
annotate-help-how-text = You can start annotating objects when you switch to Annotate mode via the Edit menu within your own objects or when you access Annotate mode from the Collection’s page Edit menu.
annotate-help-demo-button = Interactive demo
annotate-annotations-heading = Your annotations
annotate-annotations-message = You have created annotations within the following objects and/or collections:
annotate-annotations-loading = Loading your objects and collections...
annotate-annotations-empty = You don’t have any annotations yet. Start creating annotations by accessing your existing objects and collections, or creating new ones:
annotate-manage-profile-button = Manage profile
annotate-account-loading = Loading your account...
annotate-login-required-message = You must be logged in to see your annotations.

# src/app/pages/static-pages/privacy/privacy.component.html
privacy-heading = Privacy Policy

# src/app/pages/detail-page/detail-page.component.html
detail-page-last-edited-label = Last edited
detail-page-appears-in-heading = Appears in
detail-page-appears-in-view-all = View all ({ $count })
detail-page-no-permission-message = You don’t have permission to view this object. Contact the owner to request access.

# src/app/components/metadata/general/general.component.html
general-heading = General Information
general-title-label = Title *
general-title-placeholder = Enter a title
general-description-label = Description *
general-description-placeholder = Enter a description
general-collection-label = Collection
general-collection-placeholder = Enter a collection
general-tags-label = Tags (e.g. object type, discipline,...)
general-tags-placeholder = Add new or existing tag
general-tags-hint = Separate many tags by pressing comma or enter/return

# src/app/pages/profile-page/profile-page.component.html
profile-page-loading-message = Loading profile data...
profile-page-filters-active-tooltip = You have activated filters, modifying the search results

# src/app/pages/profile-page/profile-page.component.ts
profile-page-tab-objects = Objects
profile-page-tab-drafts = Drafts
profile-page-tab-collections = Collections

# src/app/pages/profile-page/compilations/compilations.component.html
profile-compilations-edit-collection-button = Edit collection
profile-compilations-remove-objects-button = Remove objects
profile-compilations-empty-no-match = No collections found matching your filter criteria
profile-compilations-empty-none = You do not have any collections and are not participating in any collections by others

# src/app/pages/profile-page/entities/entities.component.html
profile-entities-empty-no-match = No objects found matching your filter criteria
profile-entities-empty-none = You have no objects yet
profile-entities-continue-upload-button = Continue upload
profile-entities-edit-viewer-settings-button = Edit 3D settings
profile-entities-edit-metadata-button = Edit metadata

# src/app/pages/profile-page/profile-page-header/profile-page-header.component.html
profile-page-header-edit-button = Edit

# src/app/pages/profile-page/public-view/profile-public-view.component.html
profile-public-view-tab-objects = Objects
profile-public-view-tab-collections = Collections
profile-public-view-filters-active = You have activated filters, modifying the search results
profile-public-view-objects-empty = No published objects yet
profile-public-view-collections-empty = No published collections yet

# src/app/components/navigation/navbar/navbar.component.html
navbar-history-tooltip = View your history.
navbar-history-view-object-tooltip = View object.
navbar-history-view-collection-tooltip = View compilation.
navbar-profile-image-alt = Profile image
navbar-profile-type-user = User Profile
navbar-profile-type-organization = Organizational Profile
navbar-profile-view-button = View profile
navbar-other-profiles-heading = Your other profiles
navbar-create-organization-button = Create organizational profile

# src/app/pages/admin-page/admin-page.component.html
admin-page-title = User administration
admin-page-description = This page allows you to manage users. You can see all users, change their roles and see their objects and collections.
admin-page-search-hint = Use the search below to filter by a users full name, username or mail.
admin-page-filter-users-placeholder = Filter users
admin-page-role-filter-all = All roles
admin-page-role-filter-admin = Admin
admin-page-role-filter-user = User
admin-page-role-filter-upload-requested = Upload requested
admin-page-role-filter-uploader = Uploader
admin-page-column-full-name = Full name
admin-page-column-full-name-sort = Sort by full name
admin-page-column-username = Username
admin-page-column-username-sort = Sort by username
admin-page-column-mail = Mail
admin-page-column-mail-sort = Sort by mail
admin-page-column-role = Role
admin-page-column-role-sort = Sort by role
admin-page-column-created-at = Created at
admin-page-column-created-at-sort = Sort by created at
admin-page-column-actions = Actions
admin-page-show-details-button = Show details
admin-page-user-heading = Showing information about { $name }
admin-page-full-name-value = Full name: { $value }
admin-page-username-value = Username: { $value }
admin-page-mail-value = Mail: { $value }
admin-page-id-value = ID: { $value }
admin-page-role-value = Role: { $value }
admin-page-role-option-user = User
admin-page-role-option-uploader = Uploader
admin-page-change-role-button = Change user role
admin-page-tab-objects = Objects
admin-page-tab-collections = Collections
admin-page-tab-tags = Tags
admin-page-tab-persons = Persons
admin-page-tab-institutions = Institutions
admin-page-tab-annotations = Annotations
admin-page-tab-metadata = Metadata
admin-page-objects-count = Showing { $count } objects
admin-page-collections-count = Showing { $count } collections
admin-page-tags-count = Showing { $count } tags
admin-page-persons-count = Showing { $count } persons
admin-page-institutions-count = Showing { $count } institutions
admin-page-annotations-count = Showing { $count } annotations
admin-page-metadata-count = Showing { $count } metadata entries
admin-page-title-value = Title: { $value }
admin-page-type-value = Type: { $value }
admin-page-finished-yes = Finished: Yes
admin-page-finished-no = Finished: No
admin-page-online-yes = Online: Yes
admin-page-online-no = Online: No
admin-page-description-value = Description: { $value }
admin-page-compilation-entity-count = # of objects: { $count }
admin-page-compilation-annotation-count = # of annotations: { $count }
admin-page-tag-value = Value: { $value }
admin-page-person-name-value = Name: { $prename } { $name }
admin-page-name-value = Name: { $value }
admin-page-university-value = University: { $value }
admin-page-target-object-value = Target object: { $value }
admin-page-target-collection-value = Target collection: { $value }
admin-page-validated-yes = Validated: Yes
admin-page-validated-no = Validated: No
admin-page-ranking-value = Ranking: { $value }
admin-page-digest-heading = Digest
admin-page-digest-hint = Hint: First objects were uploaded starting from August 2019
admin-page-digest-year-label = Year
admin-page-digest-month-label = Month
admin-page-digest-only-finished = Only show finished
admin-page-digest-only-offline = Only show offline
admin-page-digest-no-creator = No creator info
admin-page-digest-empty = No entities

# src/app/dialogs/news-dialog/news-dialog.component.html
news-dialog-title-edit = Edit news item
news-dialog-title-create = Create news item
news-dialog-form-title-label = Title
news-dialog-form-title-placeholder = News title
news-dialog-form-content-label = Content
news-dialog-form-content-placeholder = News content (max { $maxLength } characters)
news-dialog-form-link-label = Link
news-dialog-form-image-label = Image
news-dialog-form-image-placeholder = Image URL or upload a file
news-dialog-form-image-clear-tooltip = Clear image
news-dialog-form-date-label = Date
news-dialog-form-date-placeholder = News date
news-dialog-form-published-label = Published
news-dialog-preview-heading = Live preview

# src/app/dialogs/auth-dialog/auth-dialog.component.html
auth-dialog-username-label = Username
auth-dialog-password-label = Password
auth-dialog-forgot-username-link = Forgot username?
auth-dialog-forgot-password-link = Forgot password?
auth-dialog-no-account-hint = Don’t have an account?
auth-dialog-or-label = or
auth-dialog-username-required = Username is required
auth-dialog-password-required = Password is required
auth-dialog-error-invalid-credentials = Invalid username or password

# src/app/dialogs/manage-ownership/manage-ownership.component.html
manage-ownership-title = Ownership
manage-ownership-multi-objects-count = { $count } objects
manage-ownership-multi-collections-count = { $count } collections
manage-ownership-warning-heading = Warning
manage-ownership-warning-message = If you transfer the ownership to another profile, you lose all ownership rights like deletion and changing the owner.
manage-ownership-transfer-heading = Transfer ownership to:
manage-ownership-profile-search-label = Search for a profile
manage-ownership-profiles-loading = Search for a profile...
manage-ownership-empty = No data available
manage-ownership-profile-image-alt = Profile image
manage-ownership-open-profile-tooltip = Open profile in a new tab
manage-ownership-no-description = No description
manage-ownership-transfer-button = Transfer

# src/app/dialogs/manage-ownership/manage-ownership.component.ts
manage-ownership-profile-type-user = User profile
manage-ownership-profile-type-organization = Organization
manage-ownership-profile-option-user = { $name } (User profile)
manage-ownership-profile-option-organization = { $name } (Organization)
manage-ownership-validate-login-message = Validate login before transferring ownership

# src/app/dialogs/visibility-and-access-dialog/visibility-and-access-dialog.component.ts
visibility-and-access-validate-login-message = Validate login before saving

# src/app/pages/admin-page/admin-page.component.ts
admin-page-validate-login-message = Validate login before receiving admin data

# src/app/pages/profile-page/compilations/compilations.component.ts
profile-compilations-validate-login-delete-message = Validate login before deleting: { $name }
profile-compilations-validate-login-delete-many-message = Validate login before deleting.

# src/app/pages/profile-page/entities/entities.component.ts
profile-entities-validate-login-delete-message = Validate login before deleting { $name }
profile-entities-validate-login-delete-many-message = Validate login before deleting.

# src/app/dialogs/create-new-compilation/create-or-edit-compilation.component.html
create-or-edit-compilation-title-edit = Edit collection
create-or-edit-compilation-title-create = Create new collection
create-or-edit-compilation-name-label = Name
create-or-edit-compilation-name-placeholder = Collection of ...
create-or-edit-compilation-description-label = Description
create-or-edit-compilation-description-placeholder = This collection …

# src/app/dialogs/create-new-entity/create-new-entity.component.html
create-new-entity-title-edit = Edit metadata
create-new-entity-title-create = New object
create-new-entity-step-upload = Upload
create-new-entity-step-settings = Settings
create-new-entity-step-metadata = Metadata
create-new-entity-step-visibility = Visibility and access
create-new-entity-tab-upload = Upload file(s) or folder
create-new-entity-tab-external = External server
create-new-entity-tab-sketchfab = Import from Sketchfab (Beta)
create-new-entity-upload-reset-button = Reset upload
create-new-entity-upload-begin-button = Begin upload
create-new-entity-external-intro-message = If the model you want to use is already hosted on a different server, and you wish to keep the actual file there, you can set up an external URL here.
create-new-entity-external-unavailable-message = Please note that if the model, for whatever reason, is temporarily or permanently not available at the specified URL, you will not be able to open it in our viewer.
create-new-entity-external-file-types-message = For compatibility reasons, external models are limited to the following file types:
create-new-entity-url-label = URL
create-new-entity-external-continue-button = Continue using external file
create-new-entity-sketchfab-token-hint = You can find your token on the Sketchfab settings page:
create-new-entity-sketchfab-token-label = Token
create-new-entity-sketchfab-preview-label = Detail preview
create-new-entity-sketchfab-thumbnail-alt = Thumbnail of Sketchfab model
create-new-entity-sketchfab-licence-heading = Licence
create-new-entity-sketchfab-licence-unknown = No equivalent licence in Kompakkt
create-new-entity-sketchfab-licence-missing = No licence provided
create-new-entity-sketchfab-downloadable-heading = Downloadable
create-new-entity-sketchfab-downloadable-yes = Yes
create-new-entity-sketchfab-downloadable-no = No
create-new-entity-sketchfab-downloadable-hint = To import this model you have to modify its download settings on Sketchfab, it might take up to 24 hours for the changes to take effect.
create-new-entity-sketchfab-preview-empty = Enter a valid Sketchfab model URL and your token.
create-new-entity-sketchfab-import-button = Import selected Sketchfab model
create-new-entity-metadata-errors-tooltip-show = Click to show errors
create-new-entity-metadata-errors-count = { $count ->
    [one] { $count } error detected
   *[other] { $count } errors detected
}
create-new-entity-metadata-errors-tooltip-jump = Click to jump to relevant section
create-new-entity-login-required-message = Only available for logged in Kompakkt users.

# src/app/dialogs/create-new-entity/create-new-entity.component.ts
create-new-entity-external-url-protocol = Source must start with https://
create-new-entity-external-url-extension = File extension is not supported. URL needs clean file extension, e.g.: https://example.com/public/model.glb
create-new-entity-sketchfab-token-required = Token is required
create-new-entity-sketchfab-token-length = Token should be 32 hex characters
create-new-entity-sketchfab-url-required = Model URL is required
create-new-entity-sketchfab-url-protocol = Model URL must start with https://
create-new-entity-sketchfab-url-pattern = Model URL must be from Sketchfab: https://sketchfab.com/...
create-new-entity-metadata-plugin-error-kind = Plugin Error
create-new-entity-metadata-plugin-error-message = Metadata form is modified by a plugin, and the plugin marked current metadata as invalid. Please check all tabs manually.
create-new-entity-confirm-close-title-upload = Close upload
create-new-entity-confirm-close-title-metadata = Close metadata editor
create-new-entity-confirm-close-message-upload = Do you want to close the upload?
create-new-entity-confirm-close-message-metadata = Do you want to close the metadata editor?

# src/app/dialogs/embed-object-dialog/embed-object-dialog.component.html
embed-object-dialog-title = Embed this object
embed-object-dialog-copy-embed-button = Copy
embed-object-dialog-copy-link-button = Copy model link

# src/app/components/compilation-detail/compilation-detail.component.html
compilation-detail-info-heading = Collection information
compilation-detail-types-message = Contains { $count } objects across the following types:
compilation-detail-type-image-tooltip = Images
compilation-detail-type-model-tooltip = 3D Models
compilation-detail-type-audio-tooltip = Audio files
compilation-detail-type-video-tooltip = Video files
compilation-detail-annotations-label = Total annotations
compilation-detail-objects-heading = Collection objects
compilation-detail-objects-label = Objects in this collection:

# src/app/dialogs/visibility-and-access-dialog/visibility-and-access-dialog.component.html
visibility-and-access-title = Visibility and access
visibility-and-access-count-objects = { $count } objects
visibility-and-access-count-collections = { $count } collections
visibility-and-access-publish-label = Publish on Kompakkt
visibility-and-access-download-label = Allow download
visibility-and-access-empty-collection-message = This collection is empty and will not be visible to other users until it contains at least one object.
visibility-and-access-access-heading = User access
visibility-and-access-add-person-placeholder = Add persons
visibility-and-access-accounts-loading = Fetching accounts...
visibility-and-access-member-role-owner = Owner
visibility-and-access-member-role-mixed = Mixed roles

# src/app/dialogs/visibility-and-access-dialog/visibility-and-access-dialog.component.ts
visibility-and-access-member-role-editor = Editor
visibility-and-access-member-role-viewer = Viewer

# src/app/components/entity-detail/detail-entity/detail-entity.component.html
detail-entity-reference-object-heading = Reference object
detail-entity-dimensions-heading = Dimensions
detail-entity-location-heading = Location
detail-entity-persons-institutions-heading = Persons and Institutions
detail-entity-external-identifiers-heading = External identifiers
detail-entity-external-links-heading = External links
detail-entity-biblio-refs-heading = Bibliographic references
detail-entity-attached-files-heading = Attached files
detail-entity-licence-heading = License
detail-entity-attribution-label = Attributor: { $name }
detail-entity-related-persons-institutions-heading = Related Persons and Institutions
detail-entity-creation-heading = Creation
detail-entity-creation-technique-label = Technique
detail-entity-creation-program-label = Program
detail-entity-creation-equipment-label = Equipment
detail-entity-creation-date-label = Date
# src/app/components/actionbar/actionbar.component.html
actionbar-publish-tooltip-published = Published. Click to unpublish!
actionbar-publish-tooltip-unpublished = Not public. Click to publish!
actionbar-publish-button-updating = Updating...
actionbar-publish-button-unpublish = Unpublish
actionbar-publish-button-publish = Publish!
actionbar-switch-button-show-object = Show object
actionbar-switch-button-show-collection = Show collection
actionbar-annotate-tooltip-not-allowed = You are not allowed to annotate right now.
actionbar-edit-tooltip-entity = Adjust the viewer settings, metadata or visibility of this object.
actionbar-edit-tooltip-compilation = Adjust the visibility of this collection.
actionbar-remove-objects-tooltip-allowed = Remove objects from collection
actionbar-remove-objects-tooltip-denied = You do not have permission to remove objects from this collection
actionbar-quick-add-tooltip = Use this object in a collection
actionbar-used-in-collections-tooltip-empty = This object is not used in any collection.
actionbar-used-in-collections-tooltip-explore = Explore collections containing this object.
actionbar-download-tooltip-unavailable = Download not available
actionbar-download-model-button = Download model
actionbar-download-metadata-button = Download metadata
actionbar-embed-model-button = Embed model
actionbar-embed-collection-button = Embed collection
actionbar-cite-tooltip-coming-soon = Coming soon
actionbar-cite-button = Cite
actionbar-used-in-collections-view-tooltip = View collection
actionbar-used-in-collections-annotated-recently-tooltip = The current object has been recently annotated in this collection
actionbar-used-in-collections-annotated-tooltip = The current object is annotated in this collection
actionbar-edit-menu-viewer-settings-button = Edit 3D settings
actionbar-edit-menu-metadata-button = Edit metadata
actionbar-info-object-count = { $count } objects
actionbar-info-creator-label = Creator: { $name }

# src/app/dialogs/add-to-compilation/add-to-compilation.component.html
add-to-compilation-changelog-added-new = { $count ->
    [one] { $count } object added to new collection { $name }
   *[other] { $count } objects added to new collection { $name }
}
add-to-compilation-changelog-added = { $count ->
    [one] { $count } object added to { $name }
   *[other] { $count } objects added to { $name }
}
add-to-compilation-changelog-no-changes = No changes made to { $name }
add-to-compilation-collections-heading = Your collections
add-to-compilation-search-placeholder = Search for collections
add-to-compilation-collections-empty = You don't have any collections yet.
add-to-compilation-collections-no-match = No collections found.
add-to-compilation-new-collection-button = New collection

# src/app/dialogs/add-to-compilation/is-any-entity-in-compilation.pipe.ts
add-to-compilation-tooltip-all-in-collection = All selected objects are already in this collection
add-to-compilation-tooltip-some-in-collection = Some selected objects are already in this collection. Selecting this will add the remaining objects
add-to-compilation-tooltip-none-in-collection = No selected objects are in this collection. Selecting this will add all selected objects
add-to-compilation-tooltip-no-objects-selected = No objects selected
add-to-compilation-tooltip-object-in-collection = This object is already in this collection
add-to-compilation-tooltip-object-not-in-collection = This object is not in this collection. Selecting this will add it

# src/app/components/upload/upload.component.html
upload-compatibility-directories-hint = Note: your browser does not support uploading directories
upload-compatibility-technologies-hint = Kompakkt (and the content you want to upload) works best on the latest web technologies
upload-compatibility-browser-hint = Please consider switching to a different browser!
upload-hints-recommended-types-heading = Recommended file types
upload-hints-also-supported-label = Also supported:
upload-hints-file-too-large-hint = Is your file too large?
upload-hints-guide-link = Visit our guide on optimizing models
upload-format-objects-label = 3D objects
upload-format-splat-tooltip = 3D Gaussian Splatting
upload-format-splat-label = 3DGS
upload-format-cloud-label = Pointcloud
upload-format-images-label = Images
upload-format-audio-label = Audio
upload-format-video-label = Video
upload-limit-max-file-size-label = Maximum file size:
upload-limit-per-file-label = { $size } GB per file
upload-queue-heading = Queued files
upload-queue-processing-cloud = Your point cloud is being calculated to an optimized octree.
upload-queue-processing-model = Your meshes are being compressed to a web-optimized format.
upload-queue-processing-generic = Your media is being processed.
upload-errors-filesize-heading = Maximum file size exceeded
upload-errors-filesize-message = Some files exceed the maximum allowed file size.
upload-errors-guide-hint = To prevent this:
upload-errors-guide-message = If the steps outlined in our guide are not a viable option, please contact us directly.
upload-errors-unknown-message = Some files caused an unknown error.
upload-file-input-heading = Upload file(s) or folder
upload-dropzone-hint = Drag and drop file(s) or folder here
upload-dropzone-or-label = or
upload-select-files-tooltip = Select one or multiple files
upload-select-files-button = Select file(s)
upload-select-folder-tooltip = If your 3D object includes folders, choose this option
upload-select-folder-button = Select folder
