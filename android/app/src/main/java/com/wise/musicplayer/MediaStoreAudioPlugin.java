package com.wise.musicplayer;

import android.Manifest;
import android.content.ContentUris;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.MediaStore;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
        name = "MediaStoreAudio",
        permissions = {
                @Permission(
                        alias = "audio",
                        strings = { Manifest.permission.READ_MEDIA_AUDIO }
                ),
                @Permission(
                        alias = "storage",
                        strings = { Manifest.permission.READ_EXTERNAL_STORAGE }
                )
        }
)
public class MediaStoreAudioPlugin extends Plugin {

    @PluginMethod
    public void requestPermission(PluginCall call) {
        if (hasAudioPermission()) {
            JSObject ok = new JSObject();
            ok.put("granted", true);
            call.resolve(ok);
            return;
        }
        String alias = Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ? "audio" : "storage";
        requestPermissionForAlias(alias, call, "permissionCallback");
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        result.put("granted", hasAudioPermission());
        call.resolve(result);
    }

    @PluginMethod
    public void query(PluginCall call) {
        if (!hasAudioPermission()) {
            call.reject("Audio permission not granted");
            return;
        }

        JSArray tracks = new JSArray();
        Uri collection = MediaStore.Audio.Media.EXTERNAL_CONTENT_URI;

        String[] projection = new String[] {
                MediaStore.Audio.Media._ID,
                MediaStore.Audio.Media.TITLE,
                MediaStore.Audio.Media.ARTIST,
                MediaStore.Audio.Media.ALBUM,
                MediaStore.Audio.Media.ALBUM_ID,
                MediaStore.Audio.Media.DURATION,
                MediaStore.Audio.Media.SIZE,
                MediaStore.Audio.Media.MIME_TYPE,
                MediaStore.Audio.Media.DATA,
                MediaStore.Audio.Media.DATE_ADDED,
                MediaStore.Audio.Media.DISPLAY_NAME
        };

        String selection = MediaStore.Audio.Media.IS_MUSIC + " != 0";
        String sortOrder = MediaStore.Audio.Media.DATE_ADDED + " DESC";

        try (Cursor cursor = getContext().getContentResolver().query(
                collection, projection, selection, null, sortOrder)) {

            if (cursor != null) {
                int idCol      = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media._ID);
                int titleCol   = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.TITLE);
                int artistCol  = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ARTIST);
                int albumCol   = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM);
                int albumIdCol = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.ALBUM_ID);
                int durCol     = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DURATION);
                int sizeCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.SIZE);
                int mimeCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.MIME_TYPE);
                int dataCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATA);
                int dateCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DATE_ADDED);
                int nameCol    = cursor.getColumnIndexOrThrow(MediaStore.Audio.Media.DISPLAY_NAME);

                while (cursor.moveToNext()) {
                    long id      = cursor.getLong(idCol);
                    long albumId = cursor.getLong(albumIdCol);
                    Uri contentUri = ContentUris.withAppendedId(collection, id);

                    JSObject t = new JSObject();
                    t.put("id",          String.valueOf(id));
                    t.put("title",       cursor.getString(titleCol));
                    t.put("artist",      cursor.getString(artistCol));
                    t.put("album",       cursor.getString(albumCol));
                    t.put("albumId",     albumId);
                    t.put("durationMs",  cursor.getLong(durCol));
                    t.put("size",        cursor.getLong(sizeCol));
                    t.put("mimeType",    cursor.getString(mimeCol));
                    t.put("path",        cursor.getString(dataCol));
                    t.put("dateAdded",   cursor.getLong(dateCol));
                    t.put("displayName", cursor.getString(nameCol));
                    t.put("contentUri",  contentUri.toString());
                    t.put("albumArtUri", "content://media/external/audio/albumart/" + albumId);
                    tracks.put(t);
                }
            }
        } catch (Exception e) {
            call.reject("MediaStore query failed: " + e.getMessage());
            return;
        }

        JSObject result = new JSObject();
        result.put("tracks", tracks);
        call.resolve(result);
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.fromParts("package", getContext().getPackageName(), null));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Context ctx = getActivity() != null ? getActivity() : getContext();
            if (ctx == null) {
                call.reject("No Android context available");
                return;
            }

            if (intent.resolveActivity(ctx.getPackageManager()) == null) {
                call.reject("Settings screen is not available on this device");
                return;
            }

            ctx.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Could not open settings: " + e.getMessage());
        }
    }

    private boolean hasAudioPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(
                    getContext(), Manifest.permission.READ_MEDIA_AUDIO
            ) == PackageManager.PERMISSION_GRANTED;
        }
        return ContextCompat.checkSelfPermission(
                getContext(), Manifest.permission.READ_EXTERNAL_STORAGE
        ) == PackageManager.PERMISSION_GRANTED;
    }
}