/**
 * Epic "Manage Keys" Portal Automation Script (v3)
 * =================================================
 * Automates activation of Non-Production and Production downloads
 * on the Epic on FHIR "Manage Keys" page.
 *
 * Targeted at: https://fhir.epic.com/Developer/ManageKeys (Knockout.js + Bootstrap 3)
 *
 * HOW TO USE:
 * 1. Open the "Manage Keys" page in Chrome
 * 2. Open DevTools (Cmd+Option+I)
 * 3. Go to Console tab
 * 4. Copy everything below the === COPY BELOW === marker
 * 5. Paste into Console and press Enter
 * 6. TEST FIRST: It starts in TEST_MODE (processes only 2 orgs)
 * 7. Verify downloaded files have correct secrets
 * 8. Set TEST_MODE = false and run again for all remaining orgs
 *
 * SAFETY:
 * - Secrets are captured BEFORE clicking activate
 * - Results stored in window._epicResults even if download fails
 * - Automatic pagination (20 per page)
 * - Errors are caught per-org; script continues to next org
 *
 * NOTE: The "Activate for Production" button is disabled until
 * Non-Production is activated. Script handles this order automatically.
 */

// === COPY BELOW THIS LINE ===

(async function epicActivation() {
    // ======== CONFIGURATION ========
    const TEST_MODE = false;               // false = all remaining orgs
    const MAX_ORGS = TEST_MODE ? 2 : 9999;
    const STEP_DELAY = 2500;               // ms between modal operations
    const ORG_DELAY = 3000;                // ms between organizations (enough for full modal teardown)
    // ===============================

    const results = [];
    const errors = [];
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    /**
     * Poll until testFn returns a truthy value or timeout.
     */
    async function waitFor(testFn, desc, timeout = 15000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const result = testFn();
            if (result) return result;
            await sleep(300);
        }
        throw new Error(`Timeout (${timeout}ms): ${desc}`);
    }

    // ---- DOM references ----
    const modal = document.getElementById('EnableKeysModal');
    if (!modal) {
        console.error('Could not find #EnableKeysModal. Are you on the Manage Keys page?');
        return;
    }

    // Cache the Epic environment type enum values
    const ENV_NONPROD = Epic.USCDI.DbResources.EnvironmentType.Nonprod;
    const ENV_PROD = Epic.USCDI.DbResources.EnvironmentType.Prod;

    /**
     * Trigger the EnableKeysClicked function via Knockout context.
     * This is more reliable than DOM .click() for KO-bound buttons.
     * @param {HTMLElement} row - the table row element
     * @param {*} envType - Epic.USCDI.DbResources.EnvironmentType.Nonprod or .Prod
     */
    function triggerEnableKeys(row, envType) {
        // Method 1: KO context (most reliable)
        try {
            const ctx = ko.contextFor(row);
            if (ctx && ctx.$root && ctx.$root.EnableKeysClicked) {
                ctx.$root.EnableKeysClicked(ctx.$data, envType);
                return true;
            }
        } catch (e) {
            console.log('    KO context failed:', e.message);
        }
        // Method 2: jQuery trigger (page uses jQuery)
        try {
            const btnIdx = envType === ENV_NONPROD ? 0 : 1;
            const btn = row.querySelectorAll('button.btn-primary')[btnIdx];
            if (btn) {
                $(btn).trigger('click');
                return true;
            }
        } catch (e) {
            console.log('    jQuery trigger failed:', e.message);
        }
        return false;
    }

    /**
     * Wait for Bootstrap 3 modal to be visible.
     * Checks multiple indicators since Bootstrap/KO may vary.
     */
    async function waitModalOpen() {
        await waitFor(() => {
            return modal.classList.contains('in') ||
                   modal.style.display === 'block' ||
                   document.body.classList.contains('modal-open');
        }, 'modal to open');
        await sleep(1000); // let Knockout render the modal content
    }

    /**
     * Dismiss the #modal_GenericAlert if it appears (Epic's success/info popup).
     * This alert blocks other modals from closing.
     */
    function dismissGenericAlert() {
        const alertModal = document.getElementById('modal_GenericAlert');
        if (alertModal && (alertModal.classList.contains('in') || alertModal.style.display === 'block')) {
            const okBtn = alertModal.querySelector('.modal-footer button.btn-primary');
            if (okBtn) {
                okBtn.click();
                return true;
            }
            // Fallback: use jQuery to hide it
            try { $('#modal_GenericAlert').modal('hide'); } catch (e) {}
            return true;
        }
        return false;
    }

    /**
     * Force-reset the EnableKeysModal to a fully closed state.
     * Clears Bootstrap classes, inline styles, backdrop, and body class.
     * Call this between orgs to ensure a clean slate.
     */
    async function forceResetModal() {
        // Dismiss any generic alerts first
        dismissGenericAlert();
        await sleep(300);

        // Use Bootstrap's jQuery .modal('hide') if modal is still showing
        if (modal.classList.contains('in') || modal.style.display === 'block') {
            try {
                $('#EnableKeysModal').modal('hide');
                await sleep(1000);
            } catch (e) { /* ignore */ }
        }

        // Force clean DOM state if Bootstrap hide didn't fully work
        modal.classList.remove('in');
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');

        // Remove any lingering backdrop
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

        // Clean body class
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');

        await sleep(500);
    }

    /**
     * Check if the modal is in a truly clean/closed state.
     */
    function isModalFullyClosed() {
        return !modal.classList.contains('in') &&
               modal.style.display !== 'block' &&
               modal.getAttribute('aria-hidden') === 'true' &&
               !document.querySelector('.modal-backdrop');
    }

    /**
     * Wait for the EnableKeysModal to close.
     * Also auto-dismisses any GenericAlert popups that Epic shows.
     */
    async function waitModalClose() {
        await waitFor(() => {
            // Dismiss any generic alerts that pop up (success notifications etc.)
            dismissGenericAlert();
            // Check only the EnableKeysModal state (not body.modal-open, since other modals may keep it)
            return !modal.classList.contains('in') && modal.style.display !== 'block';
        }, 'modal to close', 20000);
        await sleep(800);
        // One more check for lingering alerts
        dismissGenericAlert();
        await sleep(500);
        // Final force-reset to guarantee clean state
        await forceResetModal();
    }

    /**
     * Ensure "Other" radio and "Client Secret" radio are selected
     * inside the modal's auth section for the given environment.
     * @param {string} envPrefix - 'NonProd' or 'Prod'
     */
    function ensureClientSecretAuth(envPrefix) {
        // Step 1: Click "Other" radio in the auth type selection
        const authDiv = document.getElementById(`${envPrefix}AuthTypeSelection`);
        if (authDiv) {
            const otherRadio = authDiv.querySelector('input[value="true"]');
            if (otherRadio && !otherRadio.checked) {
                otherRadio.click();
            }
        }
        // Step 2: Click "Client Secret" radio (value="3")
        const oauthDiv = document.getElementById(`${envPrefix}BackendOauth2`);
        if (oauthDiv) {
            const csRadios = oauthDiv.querySelectorAll('input[type="radio"][value="3"]');
            for (const r of csRadios) {
                if (!r.checked && r.offsetParent !== null) {
                    r.click();
                    break;
                }
            }
        }
    }

    /**
     * Find and return the client secret from the modal's secret section.
     * Auto-waits for the secret to be generated, with fallback to clicking
     * the "New Secret" / "Get Secret" button if auto-generation doesn't happen.
     * @param {string} envPrefix - 'NonProd' or 'Prod'
     * @returns {string} The plaintext client secret
     */
    async function captureSecret(envPrefix) {
        const sectionId = `${envPrefix}ClientSecrets`;

        function findSecretValue() {
            const section = document.getElementById(sectionId);
            if (!section || section.style.display === 'none') return null;

            // Look for visible input with a long value (base64 secret)
            for (const inp of section.querySelectorAll('input')) {
                if (!inp.disabled &&
                    inp.type !== 'hidden' && inp.type !== 'radio' && inp.type !== 'checkbox' &&
                    inp.value && inp.value.length > 20 && inp.value !== 'Hash currently on file') {
                    return inp.value;
                }
            }

            // Also check KO observable for pending secret
            try {
                const ctx = ko.contextFor(section);
                if (ctx && ctx.$root) {
                    const prefix = envPrefix.toLowerCase();
                    const hasPending = ctx.$root[`Has${envPrefix}PendingSecret`];
                    if (hasPending && hasPending()) {
                        // Secret exists in KO, re-check inputs
                        for (const inp of section.querySelectorAll('input[type="text"]')) {
                            if (inp.value && inp.value.length > 20) return inp.value;
                        }
                    }
                }
            } catch (e) { /* ignore */ }

            return null;
        }

        /**
         * Find and click the "Get Secret" / "New Secret" button in the section.
         */
        function clickGetSecretButton() {
            const section = document.getElementById(sectionId);
            if (!section) return false;
            // Look for btn-success (green button) - "Get Secret" or "New Secret"
            const genBtn = section.querySelector('button.btn-success');
            if (genBtn && genBtn.offsetParent !== null) {
                console.log(`    Clicking "${genBtn.textContent.trim()}"...`);
                // Try KO context first, then jQuery, then direct click
                try {
                    const ctx = ko.contextFor(genBtn);
                    if (ctx && ctx.$root && ctx.$root.GenerateClientSecret) {
                        const envType = envPrefix === 'NonProd' ? ENV_NONPROD : ENV_PROD;
                        ctx.$root.GenerateClientSecret(ctx.$data, envType);
                        return true;
                    }
                } catch (e) { /* fallback below */ }
                try { $(genBtn).trigger('click'); return true; } catch (e) { /* fallback */ }
                genBtn.click();
                return true;
            }
            return false;
        }

        // Try 1: Wait for auto-generated secret (10 seconds)
        try {
            return await waitFor(findSecretValue, 'auto-generated secret', 10000);
        } catch (e) {
            console.log('    No auto-generated secret, clicking Get Secret button...');
        }

        // Try 2: Click "Get Secret" / "New Secret" button and wait
        if (clickGetSecretButton()) {
            await sleep(2000);
            try {
                return await waitFor(findSecretValue, 'secret after generation click', 12000);
            } catch (e) {
                console.log('    First click failed, retrying Get Secret...');
            }
        }

        // Try 3: One more attempt — re-select auth type and try again
        ensureClientSecretAuth(envPrefix);
        await sleep(1000);
        if (clickGetSecretButton()) {
            await sleep(2000);
            return await waitFor(findSecretValue, 'secret after retry', 10000);
        }

        throw new Error(`No secret found in #${sectionId} after all attempts`);
    }

    /**
     * Click the visible approve/activate button in the modal footer.
     * Uses KO context for reliability, falls back to jQuery trigger.
     * @param {string} envType - 'nonprod' or 'prod'
     */
    function clickModalApprove(envType) {
        // Method 1: Call KO function directly
        try {
            const modalEl = document.getElementById('EnableKeysModal');
            const ctx = ko.contextFor(modalEl.querySelector('.modal-body'));
            if (ctx && ctx.$root) {
                if (envType === 'nonprod' && ctx.$root.ApproveNonProdClicked) {
                    ctx.$root.ApproveNonProdClicked(ctx.$data);
                    return true;
                }
                if (envType === 'prod' && ctx.$root.ApproveProdClicked) {
                    ctx.$root.ApproveProdClicked(ctx.$data);
                    return true;
                }
            }
        } catch (e) {
            console.log('    KO approve failed, trying DOM click:', e.message);
        }

        // Method 2: Find and click the visible footer button
        const footer = modal.querySelector('.modal-footer');
        if (!footer || footer.style.display === 'none') return false;
        const btns = footer.querySelectorAll('button.btn-primary');
        for (const btn of btns) {
            if (btn.style.display !== 'none') {
                $(btn).trigger('click');
                return true;
            }
        }
        return false;
    }

    /**
     * Try to dismiss the modal (click Cancel or close button).
     */
    function dismissModal() {
        try {
            const cancelBtn = modal.querySelector('.modal-footer button.btn-default');
            if (cancelBtn) { cancelBtn.click(); return; }
            const closeBtn = modal.querySelector('[data-dismiss="modal"]');
            if (closeBtn) closeBtn.click();
        } catch (e) { /* ignore */ }
    }

    // ========== DOM-BASED PAGINATION ==========

    /**
     * Get current page number from the page indicator span.
     */
    function getCurrentPage() {
        const span = document.querySelector('.Filters .text-success');
        return span ? parseInt(span.textContent) : 1;
    }

    /**
     * Get total info from the "Showing X-Y of Z" text.
     */
    function getFilterInfo() {
        const span = document.querySelector('.Filters span[data-bind*="FilteredCount"]');
        const text = span ? span.textContent : '';
        const match = text.match(/of\s+(\d+)/);
        return { text, total: match ? parseInt(match[1]) : 0 };
    }

    /**
     * Click the Next Page button. Returns true if successful, false if on last page.
     */
    function goNextPage() {
        const nextBtn = document.querySelector('input[aria-label="Next Page"]');
        if (nextBtn && !nextBtn.disabled) {
            nextBtn.click();
            return true;
        }
        return false;
    }

    /**
     * Check if there is a next page available.
     */
    function hasNextPage() {
        const nextBtn = document.querySelector('input[aria-label="Next Page"]');
        return nextBtn && !nextBtn.disabled;
    }

    const filterInfo = getFilterInfo();
    console.log('%c=== Epic Activation Automation ===', 'font-size:16px;font-weight:bold;color:#347ab7');
    console.log(`Mode: ${TEST_MODE ? 'TEST (2 orgs)' : 'FULL RUN'}`);
    console.log(`${filterInfo.text}`);
    console.log(`Starting at page: ${getCurrentPage()}\n`);

    let totalProcessed = 0;
    let pageNum = 0;

    // ========== PAGE LOOP ==========
    pageLoop:
    while (true) {
        pageNum++;
        console.log(`%c--- Page ${getCurrentPage()} ---`, 'font-weight:bold');

        // Snapshot all rows on this page
        const allRows = [...document.querySelectorAll('table.interested-table tbody tr')];
        const unapprovedRows = allRows.filter(r => r.classList.contains('trUnapproved'));

        console.log(`  ${unapprovedRows.length} unapproved / ${allRows.length} total on this page`);

        if (unapprovedRows.length === 0) {
            console.log('  (skipping page — all orgs already activated)');
            continue;
        }

        for (const row of unapprovedRows) {
            if (totalProcessed >= MAX_ORGS) break pageLoop;

            // Skip if already activated (in case KO updated the class mid-loop)
            if (!row.classList.contains('trUnapproved')) continue;

            const cells = row.querySelectorAll('td');
            const orgName = cells[1]?.textContent?.trim();
            const orgId = cells[2]?.textContent?.trim();

            console.log(`\n%c[${totalProcessed + 1}] ${orgName} (ID: ${orgId})`, 'color:#28a745;font-weight:bold');

            // ---- PRE-CHECK: Ensure modal is fully closed before starting ----
            if (!isModalFullyClosed()) {
                console.log('  Cleaning up lingering modal state...');
                await forceResetModal();
                await sleep(1000);
            }

            // ---- STEP 1: ACTIVATE NON-PRODUCTION ----
            try {
                const nonProdBtn = row.querySelectorAll('button.btn-primary')[0];
                if (nonProdBtn && nonProdBtn.textContent.trim().includes('Activate for Non-Production')) {
                    console.log('  Non-Prod: opening modal...');
                    triggerEnableKeys(row, ENV_NONPROD);
                    await sleep(STEP_DELAY);
                    await waitModalOpen();

                    // Select Other > Client Secret auth type
                    ensureClientSecretAuth('NonProd');
                    await sleep(500);

                    // Capture the secret BEFORE activating
                    const secret = await captureSecret('NonProd');
                    results.push({ orgName, orgId, type: 'non prod', secret });
                    console.log(`  Non-prod secret captured (${secret.length} chars)`);

                    // Click activate in modal footer
                    clickModalApprove('nonprod');
                    await sleep(STEP_DELAY);

                    // Non-prod has no confirmation dialog — modal should close
                    await waitModalClose();
                    console.log('  Non-prod ACTIVATED');
                } else {
                    console.log('  Non-prod: already activated (skipping)');
                }
            } catch (err) {
                errors.push({ orgName, orgId, type: 'non prod', error: err.message });
                console.error(`  NON-PROD ERROR: ${err.message}`);
                dismissModal();
                await sleep(1000);
                await forceResetModal();
                await sleep(1500);
            }

            await sleep(ORG_DELAY);

            // ---- PRE-CHECK: Ensure modal is fully closed before prod step ----
            if (!isModalFullyClosed()) {
                console.log('  Cleaning up modal before prod step...');
                await forceResetModal();
                await sleep(1000);
            }

            // ---- STEP 2: ACTIVATE PRODUCTION ----
            try {
                // Wait for the prod button to become enabled after non-prod activation
                const prodBtn = await waitFor(() => {
                    const btns = row.querySelectorAll('button.btn-primary');
                    const btn = btns[1];
                    if (btn && !btn.disabled && btn.textContent.trim().includes('Activate for Production')) {
                        return btn;
                    }
                    return null;
                }, 'prod button to be enabled', 10000);

                console.log('  Prod: opening modal...');
                triggerEnableKeys(row, ENV_PROD);
                await sleep(STEP_DELAY);
                await waitModalOpen();

                ensureClientSecretAuth('Prod');
                await sleep(500);

                // Capture the secret BEFORE activating
                const secret = await captureSecret('Prod');
                results.push({ orgName, orgId, type: 'prod', secret });
                console.log(`  Prod secret captured (${secret.length} chars)`);

                // Click activate in modal footer
                clickModalApprove('prod');
                await sleep(STEP_DELAY);

                // Production shows a confirmation dialog inside the modal
                // The modal footer hides and #EnabledProdCofirmation div appears
                try {
                    const confirmDiv = await waitFor(() => {
                        const div = document.getElementById('EnabledProdCofirmation');
                        if (div && div.style.display !== 'none') return div;
                        return null;
                    }, 'prod confirmation dialog', 10000);

                    // Try KO direct call first, then DOM click
                    try {
                        const ctx = ko.contextFor(confirmDiv);
                        if (ctx && ctx.$root && ctx.$root.EnableProdConfirmation) {
                            ctx.$root.EnableProdConfirmation(ctx.$data);
                        } else {
                            $(confirmDiv.querySelector('button.btn-primary')).trigger('click');
                        }
                    } catch (e) {
                        const confirmBtn = confirmDiv.querySelector('button.btn-primary');
                        if (confirmBtn) $(confirmBtn).trigger('click');
                    }
                    await sleep(STEP_DELAY);
                } catch (e) {
                    console.log('  (no prod confirmation dialog appeared)');
                }

                await waitModalClose();
                console.log('  Production ACTIVATED & CONFIRMED');
            } catch (err) {
                errors.push({ orgName, orgId, type: 'prod', error: err.message });
                console.error(`  PROD ERROR: ${err.message}`);
                dismissModal();
                await sleep(1000);
                await forceResetModal();
                await sleep(1500);
            }

            totalProcessed++;
            console.log(`  Progress: ${totalProcessed} done | ${results.length} secrets captured`);
            await sleep(ORG_DELAY);
        }

        // Navigate to next page if available
        if (totalProcessed >= MAX_ORGS) break;
        if (hasNextPage()) {
            console.log('\n  >> Moving to next page...');
            goNextPage();
            await sleep(1500); // let KO re-render the table
        } else {
            break; // last page
        }
    }

    // ========== OUTPUT RESULTS ==========
    console.log('\n%c========================================', 'color:#347ab7');
    console.log('%c         AUTOMATION COMPLETE', 'font-size:14px;font-weight:bold;color:#28a745');
    console.log('%c========================================', 'color:#347ab7');
    console.log(`Organizations processed: ${totalProcessed}`);
    console.log(`Secrets captured:        ${results.length}`);
    console.log(`Errors:                  ${errors.length}`);

    if (errors.length > 0) {
        console.log('\n%cERRORS:', 'color:red;font-weight:bold');
        errors.forEach(e => console.log(`  ${e.orgName} (${e.type}): ${e.error}`));
    }

    // Format as text matching managedkeysfhir.txt
    const textOutput = results.map(r => `${r.orgName} ${r.type} ${r.secret}`).join('\n');
    const jsonOutput = JSON.stringify(results, null, 2);

    // Download text file
    try {
        const textBlob = new Blob([textOutput], { type: 'text/plain' });
        const textA = document.createElement('a');
        textA.href = URL.createObjectURL(textBlob);
        textA.download = `epic_secrets_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(textA);
        textA.click();
        textA.remove();
    } catch (e) { console.warn('Could not download .txt file'); }

    // Download JSON file (includes orgId for import script)
    try {
        const jsonBlob = new Blob([jsonOutput], { type: 'application/json' });
        const jsonA = document.createElement('a');
        jsonA.href = URL.createObjectURL(jsonBlob);
        jsonA.download = `epic_secrets_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(jsonA);
        jsonA.click();
        jsonA.remove();
    } catch (e) { console.warn('Could not download .json file'); }

    // Copy to clipboard
    try {
        await navigator.clipboard.writeText(textOutput);
        console.log('\nResults copied to clipboard');
    } catch (e) { console.log('\n(clipboard access denied — use downloaded files)'); }

    // Store in window for manual access
    window._epicResults = results;
    window._epicErrors = errors;
    window._epicText = textOutput;

    console.log('\nAccess via: window._epicResults, window._epicErrors, window._epicText');
    console.log('Downloaded: epic_secrets_*.txt and .json\n');
})();
