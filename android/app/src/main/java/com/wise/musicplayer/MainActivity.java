package com.wise.musicplayer;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Must be registered BEFORE super.onCreate()
        registerPlugin(MediaStoreAudioPlugin.class);
        super.onCreate(savedInstanceState);
    }
}