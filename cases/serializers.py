"""
Cases app — DRF Serializers
"""
from rest_framework import serializers
from .models import MissingPerson, MissingPersonImage


class MissingPersonImageSerializer(serializers.ModelSerializer):
    """Serializer for missing person images (read & upload)."""
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = MissingPersonImage
        fields = ['id', 'case', 'image', 'image_url', 'face_embedding', 'is_primary', 'uploaded_at']
        read_only_fields = ['id', 'face_embedding', 'uploaded_at', 'image_url']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class MissingPersonListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing cases."""
    reported_by_username = serializers.CharField(source='reported_by.username', read_only=True)
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = MissingPerson
        fields = [
            'id', 'name', 'age', 'gender', 'status',
            'last_seen_location', 'last_seen_time', 'registered_at',
            'reported_by', 'reported_by_username', 'primary_image',
        ]
        read_only_fields = ['id', 'registered_at']

    def get_primary_image(self, obj):
        primary = obj.images.filter(is_primary=True).first()
        if primary:
            return MissingPersonImageSerializer(primary, context=self.context).data
        return None


class MissingPersonDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer with nested images."""
    reported_by_username = serializers.CharField(source='reported_by.username', read_only=True)
    images = MissingPersonImageSerializer(many=True, read_only=True)

    class Meta:
        model = MissingPerson
        fields = [
            'id', 'name', 'age', 'gender', 'description', 'status',
            'last_seen_location', 'last_seen_time', 'registered_at',
            'reported_by', 'reported_by_username', 'images',
        ]
        read_only_fields = ['id', 'registered_at']


class MissingPersonCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new case."""

    class Meta:
        model = MissingPerson
        fields = [
            'id', 'name', 'age', 'gender', 'description',
            'last_seen_location', 'last_seen_time',
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        validated_data['reported_by'] = self.context['request'].user
        return super().create(validated_data)


class StatusUpdateSerializer(serializers.Serializer):
    """Serializer for updating case status."""
    status = serializers.ChoiceField(choices=MissingPerson.Status.choices)
